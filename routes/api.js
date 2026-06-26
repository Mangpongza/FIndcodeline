const express = require('express');
const router = express.Router();
const redis = require('../redis');
const questions = require('../data/questions');

async function ensureConnected(req, res, next) {
  if (!redis.connected) {
    const ok = await redis.connect();
    if (!ok) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }
  }
  next();
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
  const userName = req.query.userName;

  if (userName) {
    const dailyDate = await redis.getDailyLimit(userName);
    if (dailyDate === getToday()) {
      return res.json({ success: false, error: 'วันนี้คุณทำโจทย์ครบ 1 ข้อแล้ว กลับมาทำใหม่พรุ่งนี้!', dailyLimit: true });
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
  const { answers, userName } = req.body;
  const results = questions.checkAnswers(letter, answers);
  if (!results) return res.status(400).json({ success: false, error: 'Invalid request' });

  const allCorrect = results.every(r => r);

  if (allCorrect && userName) {
    const dailyDate = await redis.getDailyLimit(userName);
    if (dailyDate === getToday()) {
      return res.json({ success: false, error: 'วันนี้คุณทำโจทย์ครบ 1 ข้อแล้ว กลับมาทำใหม่พรุ่งนี้!', dailyLimit: true });
    }
    await redis.setDailyLimit(userName, getToday());
  }

  res.json({ success: true, results });
});

router.get('/state/:userName', ensureConnected, async (req, res) => {
  try {
    const data = await redis.getUserState(req.params.userName);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/state/:userName', ensureConnected, async (req, res) => {
  try {
    await redis.setUserState(req.params.userName, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/state/:userName', ensureConnected, async (req, res) => {
  try {
    await redis.deleteUserState(req.params.userName);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
