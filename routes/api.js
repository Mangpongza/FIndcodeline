const express = require('express');
const router = express.Router();
const crypto = require('crypto');
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
  return new Date().toISOString().split('T')[0];
}

router.post('/check/:letter', async (req, res) => {
  const letter = req.params.letter.toUpperCase();
  if (!isValidLetter(letter)) {
    return res.status(404).json({ success: false, error: 'Letter not found' });
  }
  const { answers, userName } = req.body;
  if (userName && !rateLimit(`c:${userName}`)) {
    return res.status(429).json({ success: false, error: 'Too fast' });
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

    const userState = await redis.getUserState(userName) || {};
    const completed = Object.keys(userState.completed || {}).length + 1;
    discord.sendNotification(`🎉 **${userName}** ปลดล็อคตัวอักษร **${letter}** สำเร็จ! (ข้อที่ ${completed})`);

    if (completed >= 8) {
      discord.sendNotification(`🏆 **${userName}** ตามหาพี่รหัสเจอแล้ว! คำใบ้คือ **scorpiong_** 🎊`);
    }
  }

  res.json({ success: true, results });
});

router.get('/state/:userName', async (req, res) => {
  try {
    if (req.params.userName.length > MAX_NAME_LEN) {
      return res.status(400).json({ success: false, error: 'Name too long' });
    }
    await tryConnect();
    const data = await redis.getUserState(req.params.userName);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/state/:userName', async (req, res) => {
  try {
    const name = req.params.userName;
    if (name.length > MAX_NAME_LEN) {
      return res.status(400).json({ success: false, error: 'Name too long' });
    }
    const contentLen = parseInt(req.headers['content-length'] || '0');
    if (contentLen > MAX_PAYLOAD) {
      return res.status(413).json({ success: false, error: 'Payload too large' });
    }
    if (!rateLimit(`s:${name}`)) {
      return res.status(429).json({ success: false, error: 'Too fast' });
    }

    await tryConnect();

    const existing = await redis.getUserState(name);
    const isNew = !existing;
    const body = { ...req.body, userName: name };

    if (isNew) {
      body.clientToken = crypto.randomUUID();
    } else {
      const provided = req.body.clientToken;
      if (existing.clientToken && provided !== existing.clientToken) {
        body.clientToken = crypto.randomUUID();
      }
    }

    discord.sendNotification(`👋 **${name}** เข้าเล่นเกมตามหาพี่รหัส!`);
    await redis.setUserState(name, body);
    res.json({ success: true, clientToken: body.clientToken, isNew });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/state/:userName', async (req, res) => {
  try {
    const name = req.params.userName;
    if (name.length > MAX_NAME_LEN) {
      return res.status(400).json({ success: false, error: 'Name too long' });
    }
    await tryConnect();
    const existing = await redis.getUserState(name);
    if (existing && existing.clientToken) {
      const provided = req.body?.clientToken || req.query?.clientToken;
      if (!provided || provided !== existing.clientToken) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }
    await redis.deleteUserState(name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
