const WebSocket = require('ws');
const http = require('http');
const Y = require('yjs');
const dotenv = require('dotenv');
const axios = require('axios');
const { setupWSConnection } = require('y-websocket/bin/utils');

// Load environment variables
dotenv.config();

// Server configuration
const SERVER_CONFIG = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '1234', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://backend:8000'
};

class APIPersistence {
  constructor(apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
    this.pendingUpdates = new Map(); // Track pending updates
  }

  async getYDoc(docName) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/v1/notes/ws/${docName}`);
      const ydoc = new Y.Doc();
      if (response.data.binary_content) {
        Y.applyUpdate(ydoc, new Uint8Array(response.data.binary_content));
      }
      return ydoc;
    } catch (error) {
      console.error('Error fetching document:', error);
      return new Y.Doc();
    }
  }

  async storeUpdate(docName, update) {
    try {
      // Debounce updates
      if (this.pendingUpdates.has(docName)) {
        clearTimeout(this.pendingUpdates.get(docName));
      }

      this.pendingUpdates.set(docName, setTimeout(async () => {
        try {
          await axios.post(`${this.apiBaseUrl}/api/v1/notes/ws/${docName}/update`, {
            update: Array.from(update)
          });
          this.pendingUpdates.delete(docName);
        } catch (error) {
          console.error('Error storing update:', error);
        }
      }, 5000)); // 5 second debounce
    } catch (error) {
      console.error('Error scheduling update:', error);
    }
  }
}

// Initialize persistence
const persistence = new APIPersistence(SERVER_CONFIG.apiBaseUrl);

// Set up persistence
const { setPersistence } = require('y-websocket/bin/utils');
setPersistence({
  provider: persistence,
  bindState: async (docName, ydoc) => {
    try {
      const persistedYdoc = await persistence.getYDoc(docName);
      
      // Apply persisted state
      const persistedState = Y.encodeStateAsUpdate(persistedYdoc);
      Y.applyUpdate(ydoc, persistedState);
      
      // Set up update handler
      ydoc.on('update', (update, origin) => {
        if (origin !== 'remote') { // Avoid infinite loops
          persistence.storeUpdate(docName, Y.encodeStateAsUpdate(ydoc));
        }
      });
    } catch (error) {
      console.error('Error binding state:', error);
    }
  },
  writeState: async (docName, ydoc) => {
    try {
      const state = Y.encodeStateAsUpdate(ydoc);
      await persistence.storeUpdate(docName, state);
    } catch (error) {
      console.error('Error writing state:', error);
    }
  }
});

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
  // You can add authentication here if needed
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

// Error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});