/* Servidor estático mínimo (sin dependencias) para la app de juegos didácticos */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = 'C:/Users/guty_/OneDrive/Escritorio/PROYECTOS PARA ELENA/juegos-didacticos';
const PORT = 8642;

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.gif': 'image/gif', '.wav': 'audio/wav',
  '.json': 'application/json', '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log('SERVIDOR OK en http://localhost:' + PORT));
