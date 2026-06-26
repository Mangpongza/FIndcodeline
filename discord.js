const https = require('https');

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function sendNotification(content) {
  if (!WEBHOOK_URL) return;
  try {
    const url = new URL(WEBHOOK_URL);
    const data = JSON.stringify({ content });
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(opts);
    req.write(data);
    req.end();
  } catch (e) {
    console.error('Discord webhook error:', e.message);
  }
}

module.exports = { sendNotification };
