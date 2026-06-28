# FIndcodeLine (ตามหาพี่รหัส)

เกมปริศนาตามหาพี่รหัส ตอบคำถามเกี่ยวกับพี่รหัสเพื่อปลดล็อคตัวอักษร และประกอบเป็นคำใบ้

## วิธีเล่น

1. กรอกชื่อเพื่อเข้าเล่น
2. คลิกตัวอักษร A-Z เพื่อทำโจทย์
3. ตอบคำถามเกี่ยวกับพี่รหัสให้ถูกต้องทุกข้อ เพื่อปลดล็อคตัวอักษรนั้น
4. ลากตัวอักษรที่ปลดล็อคแล้วไปวางในช่องปริศนา
5. วางให้ถูกตำแหน่งเพื่อเปิดเผยคำใบ้พี่รหัส

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JS
- **Backend:** Node.js + Express
- **Database:** Redis (Redis Cloud)
- **Hosting:** Vercel (Serverless Functions)
- **Notification:** Discord Webhook

## Development
```bash
npm install
npm run dev
```

## Deploy

Vercel auto-deploy จาก branch `main` โดยใช้ Serverless Functions ที่ `api/index.js`
