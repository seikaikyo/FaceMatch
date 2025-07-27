#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  let filePath = req.url === '/' ? '/demo.html' : req.url;
  
  // 移除查詢參數
  filePath = filePath.split('?')[0];
  
  // 安全檢查 - 防止路徑遍歷
  if (filePath.includes('..') || filePath.includes('~')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  
  // 處理根路徑
  if (filePath === '/') {
    filePath = '/demo.html';
  }
  
  // 處理 static 目錄
  const fullPath = path.join(__dirname, 'static', filePath);
  
  // 檢查檔案是否存在
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      // 檔案不存在，返回 404
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="utf-8">
          <title>404 - 頁面不存在</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
            .links { margin-top: 30px; }
            .links a { 
              display: inline-block; 
              margin: 10px; 
              padding: 10px 20px; 
              background: #3498db; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
            }
            .links a:hover { background: #2980b9; }
          </style>
        </head>
        <body>
          <h1>404 - 頁面不存在</h1>
          <p>找不到請求的頁面: <code>${filePath}</code></p>
          <div class="links">
            <a href="/demo.html">📊 系統展示</a>
            <a href="/index.html">🖥️ 完整系統</a>
          </div>
        </body>
        </html>
      `);
      return;
    }
    
    // 讀取並返回檔案
    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }
      
      // 設定 MIME type
      const ext = path.extname(fullPath).toLowerCase();
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`
🚀 FaceMatch 展示服務器啟動成功！

📊 展示頁面: http://localhost:${PORT}/demo.html
🖥️ 完整系統: http://localhost:${PORT}/index.html
📱 手機適配: 支援響應式設計

💡 提示: 
- demo.html: 精美的功能展示頁面
- index.html: 完整的系統界面 (需要後端 API)

按 Ctrl+C 停止服務器
`);
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('\n👋 正在關閉展示服務器...');
  server.close(() => {
    console.log('✅ 服務器已關閉');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n👋 收到終止信號，正在關閉服務器...');
  server.close(() => {
    console.log('✅ 服務器已關閉');
    process.exit(0);
  });
});