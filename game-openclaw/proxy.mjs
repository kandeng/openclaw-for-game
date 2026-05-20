#!/usr/bin/env node
/**
 * Reverse proxy for game-openclaw production mode.
 *
 * Serves built game-player and game-director web apps as static files,
 * and proxies everything else (including WebSocket) to the OpenClaw gateway.
 *
 * Architecture:
 *   Port 2026 (this proxy)
 *     /game-player/*   → static files from game-player/dist/
 *     /game-director/* → static files from game-director/dist/
 *     /*               → proxy to OpenClaw gateway on port 2027
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import httpProxy from 'http-proxy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const PROXY_PORT = parseInt(process.env.PROXY_PORT || '2026', 10);
const GATEWAY_PORT = parseInt(process.env.GATEWAY_PORT || '2027', 10);
const GATEWAY_HOST = process.env.GATEWAY_HOST || '127.0.0.1';

// Static file directories
const STATIC_APPS = {
  '/game-player': path.join(PROJECT_ROOT, 'game-player', 'dist'),
  '/game-director': path.join(PROJECT_ROOT, 'game-director', 'dist'),
};

// MIME types for common static file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.webp':  'image/webp',
  '.wasm':  'application/wasm',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// Create the reverse proxy to the OpenClaw gateway
const proxy = httpProxy.createProxyServer({
  target: `http://${GATEWAY_HOST}:${GATEWAY_PORT}`,
  ws: true,
});

proxy.on('error', (err, req, res) => {
  console.error(`[proxy] error: ${err.message}`);
  // For HTTP requests, send a 502 response.
  // For WebSocket upgrades, `res` is a Socket (not an http.ServerResponse),
  // so writeHead/end are not available — just close the socket.
  if (res && typeof res.writeHead === 'function' && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway: OpenClaw gateway unreachable');
  } else if (res && typeof res.destroy === 'function') {
    res.destroy();
  }
});

// Resolve a static file path for an app, handling SPA fallback
function resolveStaticFile(appPrefix, distDir, urlPath) {
  // Strip the app prefix to get the relative path
  const relativePath = urlPath.slice(appPrefix.length) || '/';
  let filePath = path.join(distDir, relativePath);

  // If the file exists and is not a directory, serve it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }

  // Try appending /index.html for directory-like paths
  const indexPath = path.join(filePath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return indexPath;
  }

  // SPA fallback: serve index.html for client-side routing
  const fallbackPath = path.join(distDir, 'index.html');
  if (fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return null;
}

// Serve a static file
function serveStatic(res, filePath) {
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Internal Server Error: ${err.message}`);
  }
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0]; // strip query string

  // Check if the request matches a static app prefix
  for (const [prefix, distDir] of Object.entries(STATIC_APPS)) {
    if (urlPath === prefix || urlPath.startsWith(prefix + '/')) {
      // Verify the dist directory exists
      if (!fs.existsSync(distDir)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Not Found: ${prefix} is not built. Run 'BASE=${prefix}/ pnpm build' in the app directory.`);
        return;
      }

      const filePath = resolveStaticFile(prefix, distDir, urlPath);
      if (filePath) {
        serveStatic(res, filePath);
        return;
      }

      // No static file found, fall through to proxy
      break;
    }
  }

  // Proxy to the OpenClaw gateway
  proxy.web(req, res);
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

server.listen(PROXY_PORT, () => {
  console.log(`[proxy] listening on port ${PROXY_PORT}`);
  console.log(`[proxy] forwarding to gateway at ${GATEWAY_HOST}:${GATEWAY_PORT}`);
  for (const [prefix, distDir] of Object.entries(STATIC_APPS)) {
    const exists = fs.existsSync(distDir);
    console.log(`[proxy] ${prefix} → ${distDir} ${exists ? '(found)' : '(NOT BUILT)'}`);
  }
  console.log('');
  console.log(`  Game Player:   http://localhost:${PROXY_PORT}/game-player/`);
  console.log(`  Game Director: http://localhost:${PROXY_PORT}/game-director/`);
  console.log(`  WebChat:       http://localhost:${PROXY_PORT}/webchat`);
});

// Graceful shutdown
function shutdown() {
  console.log('\n[proxy] shutting down...');
  server.close();
  proxy.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
