const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const redis = require('../redis');
const questions = require('../data/questions');
const discord = require('../discord');

// Server-side secrets - NOT exposed to client
const CODENAME = 'scorpiong_';
const REVEALED_CHARS = new Set(['_']);
const REVEAL_MAP = { S: [0], C: [1], O: [2, 6], R: [3], P: [4], I: [5], N: [7], G: [8] };

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

router.get('/codename/:userName', async (req, res) => {
  try {
    const name = req.params.userName;
    if (!isValidName(name)) return res.status(400).json({ success: false, error: 'Invalid name' });

    await tryConnect();
    const userState = await redis.getUserState(name) || {};
    const completed = userState.completed || {};
    const serverSlotContents = userState.slotContents || {};

    const slots = CODENAME.split('').map((ch, pos) => {
      if (REVEALED_CHARS.has(ch)) {
        return { pos, state: 'revealed', letter: ch };
      }
      if (serverSlotContents[pos] !== undefined) {
        return { pos, state: 'filled', letter: serverSlotContents[pos] };
      }
      return { pos, state: 'hidden' };
    });

    const availableLetters = [];
    const placedLetters = Object.values(serverSlotContents);
    for (const [alpha, positions] of Object.entries(REVEAL_MAP)) {
      if (completed[alpha]) {
        const letterLower = alpha.toLowerCase();
        const neededCount = positions.length;
        const placedCount = placedLetters.filter(l => l === letterLower).length;
        for (let i = 0; i < neededCount - placedCount; i++) {
          availableLetters.push(letterLower);
        }
      }
    }

    res.json({ success: true, slots, availableLetters });
  } catch (err) {
    console.error('GET codename error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/place-letter', async (req, res) => {
  try {
    const { userName, clientToken, position, letter } = req.body;
    if (!isValidName(userName)) return res.status(400).json({ success: false, error: 'Invalid name' });
    if (typeof position !== 'number' || !letter || typeof letter !== 'string' || letter.length !== 1) {
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }

    await tryConnect();
    const userState = await redis.getUserState(userName);
    if (!userState) return res.status(404).json({ success: false, error: 'User not found' });
    if (userState.clientToken && clientToken !== userState.clientToken) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const expectedChar = CODENAME[position];
    if (!expectedChar) return res.status(400).json({ success: false, error: 'Invalid position' });
    if (REVEALED_CHARS.has(expectedChar)) {
      return res.status(400).json({ success: false, error: 'Position is already revealed' });
    }

    const upperLetter = letter.toUpperCase();
    const posHistory = REVEAL_MAP[upperLetter];
    if (!posHistory || !posHistory.includes(position)) {
      return res.json({ success: true, correct: false });
    }

    const userCompleted = userState.completed || {};
    if (!userCompleted[upperLetter]) {
      return res.json({ success: true, correct: false });
    }

    const correct = letter.toLowerCase() === expectedChar.toLowerCase();

    if (correct) {
      const slotContents = { ...(userState.slotContents || {}), [position]: letter.toLowerCase() };
      userState.slotContents = slotContents;
      await redis.setUserState(userName, userState);

      const allFilled = CODENAME.split('').every((ch, i) => {
        if (REVEALED_CHARS.has(ch)) return true;
        return slotContents[i] !== undefined;
      });

      if (allFilled) {
        await discord.sendNotification(`🏆 **${userName}** ตามหาพี่รหัสเจอแล้ว! คำใบ้คือ **${CODENAME}** 🎊`);
      }

      res.json({ success: true, correct: true, completed: allFilled });
    } else {
      res.json({ success: true, correct: false });
    }
  } catch (err) {
    console.error('POST place-letter error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/remove-letter', async (req, res) => {
  try {
    const { userName, clientToken, position } = req.body;
    if (!isValidName(userName)) return res.status(400).json({ success: false, error: 'Invalid name' });
    if (typeof position !== 'number') return res.status(400).json({ success: false, error: 'Invalid request' });

    await tryConnect();
    const userState = await redis.getUserState(userName);
    if (!userState) return res.status(404).json({ success: false, error: 'User not found' });
    if (userState.clientToken && clientToken !== userState.clientToken) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const slotContents = { ...(userState.slotContents || {}) };
    delete slotContents[position];
    userState.slotContents = slotContents;
    await redis.setUserState(userName, userState);

    res.json({ success: true });
  } catch (err) {
    console.error('POST remove-letter error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
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

    const userState = await redis.getUserState(userName) || {};
    const completed = Object.keys(userState.completed || {}).length + 1;
    await discord.sendNotification(`🎉 **${userName}** ปลดล็อคตัวอักษร **${letter}** สำเร็จ! (ข้อที่ ${completed})`);

    if (completed >= 8) {
      await discord.sendNotification(`🏆 **${userName}** ตามหาพี่รหัสเจอแล้ว! คำใบ้คือ **${CODENAME}** 🎊`);
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
    const provided = req.query.clientToken;
    if (data.clientToken && provided !== data.clientToken) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const safe = { ...data };
    delete safe.clientToken;
    res.json({ success: true, data: safe });
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

    const existing = await redis.getUserState(name);
    const isNew = !existing;
    const body = { ...req.body, userName: name };

    // Preserve validated slotContents from server (only /place-letter can modify it)
    if (existing && existing.slotContents) {
      body.slotContents = existing.slotContents;
    }

    if (isNew) {
      body.clientToken = crypto.randomUUID();
    } else {
      const provided = req.body.clientToken;
      if (existing.clientToken && provided !== existing.clientToken) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      body.clientToken = existing.clientToken;
    }

    if (body.isLogin) {
      await discord.sendNotification(`👋 **${name}** เข้าเล่นเกมตามหาพี่รหัส!`);
    }
    await redis.setUserState(name, body);
    res.json({ success: true, clientToken: body.clientToken, isNew });
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
    console.error('DELETE state error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
