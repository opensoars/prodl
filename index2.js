/**
 * App namespace
 */
var app = {};


app.start_time = new Date().getTime();
app.ready_time = 0;
app.time_taken = 0;

/**
 * Modules namespace
 */
app.modules = {
  fs: require('fs'),
  qs: require('querystring'),
  http: require('http'),
  https: require('https'),
  cls: require('opensoars_cls'),
  Ezlog: require('ezlog'),
  f_: require('f_')
};


app.temp_dir = __dirname + '/temp';

/**
 * HTTP API namespace
 */
app.http_api = {};
app.http_api.base = '/api';

app.static_api = {};
app.static_api.base = '/static';
app.static_api.dir = __dirname + '/public';

/**
 * Libraries namespace
 */
app.libs = {};

/**
 * User defined paramaters namespace
 */
app.params = function (){
  var p = require('./params.json');

  if(!p.dl_dir)
    throw 'No dl_dir specified in p.json';
  if(!p.app_port)
    throw 'No app_port specified in p.json';
  if(!p.http_api_port)
    throw 'No http_api_port specified in p.json';
  if(!p.ws_port)
    throw 'No ws_port specified in p.json';

  p.max_retries = p.max_retries ? p.max_retries : 10;
  p.use_log = p.use_log == false ? false : true;

  return p;
}();


/**
 * Add loggers to app namespace
 */
app = require('./lib/logs')(app);

/**
 * Create an app dump helper function
 */
app.libs.dump = require('./lib/dump')(app);
app.dump = app.libs.dump.create({
  dir: __dirname + '/dump/'
});

/**
 * Require downloads collection and assign shorthand to app namespace
 */
app.libs.downloads = require('./lib/collections/downloads');
app.downloads = app.libs.downloads;

app.libs.Download = require('./lib/constructors/Download')(app);

app.Download = app.libs.Download;

// Download fixtures
setTimeout(function (){
  var dl1 = app.modules.f_.setup(new app.Download({v: 'NnTg4vzli5s'})),
      dl2 = app.modules.f_.setup(new app.Download({v: '-n00X3fase4'}));

  dl1.start();
  //dl2.start();

  app.downloads
    .add(dl1)
    //.add(dl2);
}, 500);




/**
 * Require HTTP functionality
 */
app.libs.http = require('./lib/servers/http')(app);
app.http_api.router = app.libs.http.router;
app.http_api.handlers = app.libs.http.handlers;


/**
 * Routes
 */
app.http_api.router
  .get('/downloads', app.http_api.handlers.getAll)
  .get('/downloads/:id', app.http_api.handlers.getById)
  .post('/downloads/:v', app.http_api.handlers.postNew);

/**
 * Create server and start listening
 */
app.http_api.server =
  app.libs.http.create(app.http_api.router.listener)
    .listen(app.params.http_api_port);

app.http_api_log('Server listening at port ' + app.params.http_api_port);

/**
 * Start up/time notifier
 */
app.ready_time = new Date().getTime();
app.time_taken = app.ready_time - app.start_time;

app.log('Ready for business, launch time: ' + app.time_taken + 'ms');