const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('../routes/api');

const app = express();

app.use(cors());
app.use(express.json());

const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir, { dotfiles: 'ignore' }));

app.use('/api', apiRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

module.exports = app;
