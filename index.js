(function (){

  var start_date = new Date().getTime(),
      done_date = 0,
      time_taken = 0;


  /**
   *
   * App namespacing
   *
   */ 
  var app = {};
  process.app = app;

  /**
   *
   * App modules
   * 
   */
  app.modules = {
    fs: require('fs'),
    qs: require('querystring'),
    http: require('http'),
    cls: require('opensoars_cls'),
    Ezlog: require('ezlog')
  };


  /**
   *
   * Get/check/fix user definable parameters
   *
   */
  app.params = require('./params.json');

  if(!app.params.dl_dir)
    throw 'No dl_dir specified in params.json';
  if(!app.params.app_port)
    throw 'No app_port specified in params.json';
  if(!app.params.http_api_port)
    throw 'No http_api_port specified in params.json';
  if(!app.params.ws_port)
    throw 'No ws_port specified in params.json';

  if(!app.params.max_retries)
    app.params.max_retries = 10;
  if(!app.params.log && app.params.log !== false)
    app.params.log = true;


  /**
   *
   * App variables
   * 
   */
  app.api = {
    http: {
      url: '/api',
      url_re: /^\/api\/?/
    }
  };


  /**
   *
   * Setup all loggers
   *
   */
  require('./lib/loggers');


  /**
   *
   * App libraries
   *
   */
  app.downloads = require('./lib/collections/downloads.js');

  app.http = require('./lib/servers/http/');
  app.ws = require('./lib/servers/ws');

  app.Dump = require('./lib/dump');


  /**
   *
   * Initialize
   *
   */

  app.dump = new app.Dump({
    dir: __dirname + '/dump/'
  });


  // Start listening for HTTP requests
  app.http.server = app.http.create(app.http.listener)
    .listen(app.params.http_api_port);

  if(app.params.log)
    app.log('HTTP server listening at port: ' + app.params.http_api_port);


  // Startup info
  done_date = new Date().getTime();
  app.time_taken = done_date - start_date;

  if(app.params.log)
    app.log('Launched in ' +  app.time_taken + ' ms\n'
      + '- - - - - - - - - - - - - - - - - - - - - - - - -');



}());


