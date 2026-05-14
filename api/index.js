const serverless = require('serverless-http');

let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const { createApp } = require('../backend/app');
    const app = await createApp();
    handler = serverless(app, { binary: ['image/*', 'application/pdf'] });
  }
  return handler(req, res);
};
