const express = require('express');
const path = require('path');
const app = express();

// 提供靜態文件
app.use(express.static(path.join(__dirname, 'static')));

// 處理所有路由，返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`✅ 靜態前端服務器啟動在 http://localhost:${PORT}`);
  console.log(`🔗 請使用此地址訪問完整的 FaceMatch 系統`);
  console.log(`👤 登入帳號: admin / admin123`);
});