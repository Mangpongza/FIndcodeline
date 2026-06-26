const https = require('https');
require('dotenv').config();

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1520009543843577907/nx4ienYvB4gBldL2Y0jjwgagizUql6cYO6cgqKd4HEWhu3hDCLl-nK5B9RkMnq8_g9DJ';

function now() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function sendNotification(content) {
  if (!WEBHOOK_URL) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const url = new URL(WEBHOOK_URL);
      const data = JSON.stringify({ content: `\`[${now()}]\` ${content}` });
      const opts = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 3000,
      };
      const req = https.request(opts, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', (e) => {
        console.error('Discord webhook error:', e.message);
        resolve();
      });
      req.on('timeout', () => { req.destroy(); resolve(); });
      req.write(data);
      req.end();
    } catch (e) {
      console.error('Discord webhook error:', e.message);
      resolve();
    }
  });
}

module.exports = { sendNotification };
