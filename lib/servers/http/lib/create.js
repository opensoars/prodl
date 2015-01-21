/**
 * Creates an HTTP server
 *
 * @param listener {function}
 * @return         {object}    Server instance
 */
module.exports = function create(listener){
  return process.app.modules.http.createServer(listener);
};