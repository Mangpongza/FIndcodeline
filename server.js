require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const redis = require('./services/redis');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use('/api', apiRoutes);

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
