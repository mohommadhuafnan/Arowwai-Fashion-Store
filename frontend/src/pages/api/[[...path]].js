let appPromise;

function rewriteUrl(req) {
  const segments = req.query?.path;
  const suffix = Array.isArray(segments)
    ? segments.join('/')
    : (typeof segments === 'string' ? segments : '');
  const qs = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const apiPath = `/api/${suffix}${qs}`;
  req.url = apiPath;
  req.originalUrl = apiPath;
}

export default async function apiHandler(req, res) {
  rewriteUrl(req);

  if (!appPromise) {
    const { createApp } = require('../../../server-backend/app');
    appPromise = createApp();
  }

  const app = await appPromise;
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
