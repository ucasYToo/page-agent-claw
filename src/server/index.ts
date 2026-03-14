import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { createProxyMiddleware } from './middleware/proxy.js';
import { createWebSocketServer } from './websocket/index.js';
import { setupRoutes } from './routes/task.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4222;
// Client build output is in dist/client relative to project root
const CLIENT_PATH = path.resolve(__dirname, '../../dist/client');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client build
app.use(express.static(CLIENT_PATH));

// Proxy middleware - must be before static file serving
app.use('/proxy/:target(*)', createProxyMiddleware());

// Setup API routes
setupRoutes(app);

// Serve index.html for all non-API, non-proxy routes (SPA support)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/proxy')) {
    res.sendFile(path.join(CLIENT_PATH, 'index.html'));
  }
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
createWebSocketServer(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
  console.log(`Serving static files from: ${CLIENT_PATH}`);
});

export default server;
