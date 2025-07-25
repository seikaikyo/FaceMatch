const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  
  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  
  res.end(JSON.stringify({
    message: 'Test server is working!',
    timestamp: new Date().toISOString(),
    ip: req.connection.remoteAddress,
    method: req.method,
    url: req.url
  }));
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Test server running on http://0.0.0.0:8080');
  console.log('Try accessing from external IP: http://172.17.165.20:8080');
});