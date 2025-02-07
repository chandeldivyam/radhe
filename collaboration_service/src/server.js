const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Server configuration
const SERVER_CONFIG = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '1234', 10),
  cors: {
    origin: process.env.BACKEND_CORS_ORIGINS || '*'
  }
};

// Create WebSocket server
const wss = new WebSocket.Server({ 
  noServer: true,
  clientTracking: true 
});

// Create HTTP server with health check endpoint
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  console.log(`New client connected from ${req.socket.remoteAddress}`);
  setupWSConnection(ws, req);
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  // TODO: Add authentication middleware here
  // const isAuthorized = checkAuth(request);
  // if (!isAuthorized) {
  //   socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  //   socket.destroy();
  //   return;
  // }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Start server
server.listen(SERVER_CONFIG.port, SERVER_CONFIG.host, () => {
  console.log(`WebSocket server running at ws://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
  console.log(`Health check available at http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});