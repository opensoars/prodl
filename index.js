(function (){

  /**
   *
   * App namespacing/variables
   *
   */ 
  var app = {};
  process.app = app;


  app.api = {
    http: {
      url: '/api',
      url_re: /^\/api\/?/
    }
  };

  app.modules = {
    fs: require('fs'),
    qs: require('querystring'),
    http: require('http'),
    cls: require('opensoars_cls'),
    Ezlog: require('ezlog')
  };


  /**
   *
   * App logger/cli styling
   *
   */
  app.log = new app.modules.Ezlog(['[app]', 'green']);
  app.logErr = new app.modules.Ezlog(['[app]', 'green'], ['red']);
  app.logWarn = new app.modules.Ezlog(['[app]', 'green'], ['yellow']);


  /**
   *
   * App requirements
   *
   */

  // Downloads collection
  app.downloads = require('./lib/collections/downloads.js');


  // Servers functionality
  app.http = require('./lib/servers/http/');
  app.ws = require('./lib/servers/ws');

  // Dump utility
  app.Dump = require('./lib/dump');


  /**
   *
   * Get/check/fix user definable parameters
   *
   */
  app.params = require('./params.json');

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
  app.http.server = app.http.create(app.http.listener)
    .listen(app.params.http_server_port);


}());


