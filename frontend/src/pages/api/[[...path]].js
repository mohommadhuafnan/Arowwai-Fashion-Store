const serverless = require('serverless-http');

let handler;

export default async function apiHandler(req, res) {
  if (!handler) {
    const { createApp } = require('../../../server-backend/app');
    const app = await createApp();
    handler = serverless(app, { binary: ['image/*', 'application/pdf'] });
  }
  return handler(req, res);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
