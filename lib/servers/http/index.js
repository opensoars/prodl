/**
 * App HTTP server functionality
 */
module.exports = function (app){

  app = app || {};

  var create = require('./lib/create.js')(app),
      router = require('./lib/router')(app),
      handlers = require('./lib/handlers')(app);

  return {
    create: create,
    router: router,
    handlers: handlers
  };
};