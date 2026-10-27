// Production server entry file for Hostinger Node.js Application Manager
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH !== undefined
  ? process.env.NEXT_PUBLIC_BASE_PATH
  : '/bhookasur_ka_food_tour').replace(/\/+$/, '');

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // If server receives request at root '/' without basePath, redirect to the campaign basePath
      if (basePath && (req.url === '/' || req.url === '')) {
        res.writeHead(307, { Location: `${basePath}/` });
        res.end();
        return;
      }

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Bakasur Food Tour server running on http://${hostname}:${port}${basePath || '/'}`);
  });
});
