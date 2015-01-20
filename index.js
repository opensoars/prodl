(function (){

  /**
   *
   * App namespacing/variables
   *
   */ 
  var app = {};
  process.app = app;

  // App APIs namespace
  app.apis = {};


  /**
   *
   * App modules
   *
   */
  app.fs = require('fs');
  app.qs = require('querystring');
  app.cls = require('opensoars_cls');
  app.Ezlog = require('ezlog');


  /**
   *
   * App logger/cli styling
   *
   */
  app.log = new app.Ezlog(['[app]', 'green']);
  app.logErr = new app.Ezlog(['[app]', 'green'], ['red']);
  app.logWarn = new app.Ezlog(['[app]', 'green'], ['yellow']);


  /**
   *
   * App requirements
   *
   */

  // Require user definable parameters
  app.params = require('./params.json');

  // Downloads collection
  app.downloads = require('./lib/collections/downloads.js');

  // Servers functionality
  app.http_server = require('./lib/servers/http.js');
  app.ws_server = require('./lib/servers/ws.js');

  // APIS
  app.apis.http = require('./lib/apis/http.js');
  app.apis.ws = require('./lib/apis/http.js');

  // Dump utility
  app.Dump = require('./lib/dump');


  /**
   *
   * Check/fix required params
   *
   */
  if(!app.params.dl_dir)
    return app.logErr('No dl_dir specified in params.json');
  if(!app.params.app_port)
    return app.logErr('No app_port specified in params.json');
  if(!app.params.http_server_port)
    return app.logErr('No http_server_port specified in params.json');
  if(!app.params.ws_port)
    return app.logErr('No ws_port specified in params.json');

  if(!app.params.max_retries)
    app.params.max_retries = 10;
  if(!app.params.log_all)
    app.params.log_all = true;


  /**
   *
   * Initialization
   *
   */

  app.dump = new app.Dump({
    dir: __dirname + '/dump/'
  });


  // Initialize the http server
  app.http_server.instance = app.http_server.create(app.apis.http)
    .listen(process.app.params.http_server_port);


}());


