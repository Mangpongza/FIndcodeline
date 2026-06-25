const express = require('express');
const router = express.Router();
const redis = require('../redis');

async function ensureConnected(req, res, next) {
  if (!redis.connected) {
    const ok = await redis.connect();
    if (!ok) {
      return res.status(503).json({ success: false, error: 'Database not available' });
    }
  }
  next();
}

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
