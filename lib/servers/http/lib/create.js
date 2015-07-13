/**
 * Creates an HTTP server
 * @param {function} router - Router function from router.js
 * @param {object} app - Top level application namespace
 * @return {object} - Server instance
 */
module.exports = function create(app) {
  app = app || {};

  return function create(router) {
    if (app.http_log) {
      app.http_log('Creating server');
    }
    return app.modules.http.createServer(router);
  };
};