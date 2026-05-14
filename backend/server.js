require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const initSocket = require('./src/config/socket');

const PORT = process.env.PORT || 5000;

(async () => {
  const app = await createApp();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`🚀 TrendyPOS AI Server running on port ${PORT}`);
  });
})();
