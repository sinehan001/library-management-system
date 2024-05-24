// middleware/syncHandler.js

// Synchronous error catching middleware
const syncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = syncHandler;
