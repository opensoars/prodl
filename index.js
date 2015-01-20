/**
 * App modules to be globalized
 */
var Ezlog = require('ezlog');


(function (){

  /**
   *
   * Global app namespace
   *
   */ 
  var app = {};
  process.app = app;


  /**
   *
   * App requirements
   *
   */

  // Require user definable parameters
  process.app.params = require('./params.json');

  // HTTP server functionality
  app.http_server = require('./lib/servers/http.js');

  // Websocket server functionality
  app.ws_server = require('./lib/servers/ws.js');


  /**
   *
   * Initialization
   *
   */

  // Initialize the http server
  app.http_server.instance = app.http_server.create(app.apis.http)
    .listen(process.app.params.http_port);


  // Update global app namespace with scoped app variable
  process.app = app;

}());


