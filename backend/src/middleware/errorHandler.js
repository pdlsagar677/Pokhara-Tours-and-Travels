function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (status >= 500) console.error(err);
  const body = { error: message };
  if (process.env.NODE_ENV !== 'production' && err.code) {
    body.code = err.code;
  }
  res.status(status).json(body);
}

module.exports = errorHandler;
