require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const redis = require('./redis');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use('/api', (req, res, next) => {
  if (req.originalUrl.includes('..')) {
    return res.status(400).json({ success: false, error: 'Invalid path' });
  }
  next();
});
app.use('/api', apiRoutes);

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ success: false, error: 'Not found' });
  } else {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
  }
});

async function start() {
  const redisConnected = await redis.connect();
  if (!redisConnected) {
    console.log('Starting without Redis connection (in-memory/live will be used if available)');
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
