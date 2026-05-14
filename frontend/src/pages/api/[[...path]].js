const serverless = require('serverless-http');

let handler;

function rewriteUrl(req) {
  const segments = req.query?.path;
  const suffix = Array.isArray(segments) ? segments.join('/') : (segments || '');
  const query = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  req.url = `/api/${suffix}${query}`;
}

export default async function apiHandler(req, res) {
  rewriteUrl(req);

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
