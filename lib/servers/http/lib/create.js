/**
 * Creates an HTTP server
 *
 * @param router {function}
 * @return       {object}    Server instance
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