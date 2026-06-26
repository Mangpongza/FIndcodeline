require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('../routes/api');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', (req, res, next) => {
  if (req.path.includes('..')) {
    return res.status(400).json({ success: false, error: 'Invalid path' });
  }
  next();
});
app.use('/api', apiRoutes);

module.exports = app;
