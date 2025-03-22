const { Server } = require('@hocuspocus/server');
const { Database } = require('@hocuspocus/extension-database');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Server configuration
const SERVER_CONFIG = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '1234', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://backend:8000',
  idleTimeout: parseInt(process.env.IDLE_TIMEOUT || '90000', 10) // 15 minutes default (in milliseconds)
};

// In-memory cache with access timestamps
const memoryCache = new Map(); // Key: documentName, Value: { data: Uint8Array, lastAccessed: number }

// Cleanup function to remove idle documents
const cleanupIdleDocuments = () => {
  console.log('Running cleanup...');
  const now = Date.now();
  console.log(`length of memory cache: ${memoryCache.size}`);
  for (const [documentName, { lastAccessed }] of memoryCache) {
    console.log(`Checking document ${documentName} last accessed at ${lastAccessed}`);
    if (now - lastAccessed > SERVER_CONFIG.idleTimeout) {
      memoryCache.delete(documentName);
      console.log(`Removed idle document ${documentName} from memory cache`);
    }
  }
};

// Run cleanup every 10 minutes (adjustable)
const CLEANUP_INTERVAL = 1 * 60 * 1000; // 10 minutes in milliseconds
setInterval(cleanupIdleDocuments, CLEANUP_INTERVAL);

// Create custom database extension with in-memory caching
const customDatabase = new Database({
  fetch: async ({ documentName }) => {
    const now = Date.now();
    // Check if document exists in memory
    if (memoryCache.has(documentName)) {
      const cached = memoryCache.get(documentName);
      cached.lastAccessed = now; // Update access time
      console.log(`Serving ${documentName} from memory cache`);
      return cached.data;
    }

    // If not in memory, fetch from backend API
    try {
      const response = await axios.get(`${SERVER_CONFIG.apiBaseUrl}/api/v1/notes/ws/${documentName}`);
      if (response.data.binary_content) {
        const documentData = new Uint8Array(response.data.binary_content);
        // Store in memory with current timestamp
        memoryCache.set(documentName, { data: documentData, lastAccessed: now });
        console.log(`Fetched ${documentName} from API and cached in memory`);
        return documentData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  },
  store: async ({ documentName, state }) => {
    const now = Date.now();
    try {
      if (Array.from(state).length > 0) {
        // Update in-memory cache with new state and timestamp
        const documentData = new Uint8Array(state);
        memoryCache.set(documentName, { data: documentData, lastAccessed: now });
        console.log(`Updated ${documentName} in memory cache`);

        // Persist to backend API
        await axios.post(`${SERVER_CONFIG.apiBaseUrl}/api/v1/notes/ws/${documentName}/update`, {
          update: Array.from(state)
        });
        console.log(`Persisted ${documentName} to backend API`);
      }
    } catch (error) {
      console.error('Error storing document:', error);
    }
  },
});

// Configure Hocuspocus server
const server = Server.configure({
  name: "notes-collaboration-server",
  port: SERVER_CONFIG.port,
  address: SERVER_CONFIG.host,
  timeout: 30000,
  debounce: 5000,
  maxDebounce: 10000,
  extensions: [
    customDatabase,
  ],
});

// Start server
server.listen();

console.log(`Server running on ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.destroy().then(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Error handling for unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});