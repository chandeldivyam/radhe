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
  apiBaseUrl: process.env.API_BASE_URL || 'http://backend:8000'
};

// Create custom database extension
const customDatabase = new Database({
  fetch: async ({ documentName }) => {
    try {
      const response = await axios.get(`${SERVER_CONFIG.apiBaseUrl}/api/v1/notes/ws/${documentName}`);
      if (response.data.binary_content) {
        console.log('success')
        return new Uint8Array(response.data.binary_content);
      }
      return null;
    } catch (error) {
      console.error('Error fetching document:', error);
      return null;
    }
  },
  store: async ({ documentName, state }) => {
    console.log('here in store')
    try {
      if (Array.from(state).length > 0) {
        await axios.post(`${SERVER_CONFIG.apiBaseUrl}/api/v1/notes/ws/${documentName}/update`, {
          update: Array.from(state)
        });
      }
    } catch (error) {
      console.error('Error storing document:');
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