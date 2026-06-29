const express = require('express');
const router = express.Router();
const redis = require('../redis');
const questions = require('../data/questions');
const discord = require('../discord');

const MAX_NAME_LEN = 50;
const MAX_PAYLOAD = 10240;

const rateLimitMap = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitMap) {
    if (now > v.reset) rateLimitMap.delete(k);
  }
}, 60000);

function rateLimit(key, max = 30, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function isValidLetter(l) {
  return /^[A-Z]$/.test(l);
}

function isValidName(name) {
  return /^[a-zA-Z0-9_\-\u0E00-\u0E7F]+$/.test(name) && name.length <= MAX_NAME_LEN;
}

async function tryConnect() {
  if (!redis.connected) {
    await redis.connect();
  }
}

router.get('/config', (req, res) => {
  res.json({
    success: true,
    codename: 'scorpiong_',
    revealedChars: ['_'],
    revealMap: {
      S: [0], C: [1], O: [2, 6], R: [3], P: [4], I: [5], N: [7], G: [8]
    }
  });
});

router.get('/questions/:letter', async (req, res) => {
  const letter = req.params.letter.toUpperCase();
  if (!isValidLetter(letter)) {
    return res.status(404).json({ success: false, error: 'Letter not found' });
  }
  const userName = req.query.userName;

  if (userName) {
    if (!isValidName(userName)) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }
    if (!rateLimit(`q:${userName}`)) {
      return res.status(429).json({ success: false, error: 'Too fast' });
    }
    const dailyDate = await redis.getDailyLimit(userName);
    if (dailyDate === getToday()) {
      return res.json({ success: false, error: 'วันนี้น้องทำโจทย์ครบ 1 ข้อแล้ว กลับมาทำใหม่พรุ่งนี้!', dailyLimit: true });
    }
  }

  const qs = questions.getQuestions(letter);
  if (!qs) return res.status(404).json({ success: false, error: 'Letter not found' });
  res.json({ success: true, questions: qs });
});

function getToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
}

router.post('/check/:letter', async (req, res) => {
  const letter = req.params.letter.toUpperCase();
  if (!isValidLetter(letter)) {
    return res.status(404).json({ success: false, error: 'Letter not found' });
  }
  const { answers, userName } = req.body;
  if (userName) {
    if (!isValidName(userName)) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }
    if (!rateLimit(`c:${userName}`)) {
      return res.status(429).json({ success: false, error: 'Too fast' });
    }
  }
  const results = questions.checkAnswers(letter, answers);
  if (!results) return res.status(400).json({ success: false, error: 'Invalid request' });

  const allCorrect = results.every(r => r);

  if (allCorrect && userName) {
    const dailyDate = await redis.getDailyLimit(userName);
    if (dailyDate === getToday()) {
      return res.json({ success: false, error: 'วันนี้คุณทำโจทย์ครบ 1 ข้อแล้ว กลับมาทำใหม่พรุ่งนี้!', dailyLimit: true });
    }
    await redis.setDailyLimit(userName, getToday());

    let userState = await redis.getUserState(userName) || {};
    userState.completed = userState.completed || {};
    userState.completed[letter] = true;
    if (!userState.failed) userState.failed = {};
    if (!userState.slotContents) userState.slotContents = {};
    userState.userName = userName;
    await redis.setUserState(userName, userState);

    const completedCount = Object.keys(userState.completed).length;
    discord.sendNotification(`🎉 **${userName}** ปลดล็อคตัวอักษร **${letter}** สำเร็จ! (ข้อที่ ${completedCount})`);

    if (completedCount >= 8) {
      discord.sendNotification(`🏆 **${userName}** ตามหาพี่รหัสเจอแล้ว! คำใบ้คือ **scorpiong_** 🎊`);
    }
  }

  res.json({ success: true, results });
});

router.get('/state/:userName', async (req, res) => {
  try {
    const name = req.params.userName;
    if (!isValidName(name)) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }
    await tryConnect();
    const data = await redis.getUserState(name);
    if (!data) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error('GET state error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/state/:userName', async (req, res) => {
  try {
    const name = req.params.userName;
    if (!isValidName(name)) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }
    const contentLen = parseInt(req.headers['content-length'] || '0');
    if (contentLen > MAX_PAYLOAD) {
      return res.status(413).json({ success: false, error: 'Payload too large' });
    }
    if (!rateLimit(`s:${name}`)) {
      return res.status(429).json({ success: false, error: 'Too fast' });
    }

    await tryConnect();

    const body = { ...req.body, userName: name };

    if (body.isLogin) {
      await discord.sendNotification(`👋 **${name}** เข้าเล่นเกมตามหาพี่รหัส!`);
    }
    await redis.setUserState(name, body);
    res.json({ success: true });
  } catch (err) {
    console.error('PUT state error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/state/:userName', async (req, res) => {
  try {
    const name = req.params.userName;
    if (!isValidName(name)) {
      return res.status(400).json({ success: false, error: 'Invalid name' });
    }
    await tryConnect();
    await redis.deleteUserState(name);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE state error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
