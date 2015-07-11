/**
 *
 * @desc Main application namespace
 * @namespace
 *
 */
var app = {};


app.start_time = new Date().getTime();
app.ready_time = 0;
app.time_taken = 0;

/**
 *
 * @desc Application module namespace
 * @namespace
 *
 */
app.modules = {
  fs: require('fs'),
  qs: require('querystring'),
  http: require('http'),
  https: require('https'),
  cls: require('opensoars_cls'),
  Ezlog: require('ezlog'),
  f_: require('f_'),
  spawn: require('child_process').spawn,
  os: require('os')
};


app.temp_dir = __dirname + '/temp/';

/**
 *
 * @desc HTTP API namespace
 * @namespace
 *
 */
app.http_api = {};
app.http_api.base = '/api';

app.static_api = {};
app.static_api.base = '/static';
app.static_api.dir = __dirname + '/public';

/**
 *
 * @desc Application libraries namespace
 * @namespace
 *
 */
app.libs = {};

/**
 *
 * @desc User defined paramaters namespace (params.json)
 * @namespace
 *
 */
app.params = function (){
  var p = require('./params.json');

  if(!p.dl_dir)
    throw 'No dl_dir specified in params.json';
  if(!p.app_port)
    throw 'No app_port specified in params.json';
  if(!p.http_api_port)
    throw 'No http_api_port specified in params.json';
  if(!p.ws_port)
    throw 'No ws_port specified in params.json';

  p.max_retries = p.max_retries ? p.max_retries : 10;
  p.use_log = p.use_log == false ? false : true;

  return p;
}();



// Add loggers to app namespace
app = require('./lib/logs')(app);


// Create an app dump helper function
app.libs.dump = require('./lib/dump')(app);
app.dump = app.libs.dump.create({
  dir: __dirname + '/dump/'
});


// Require decipher swap function solutions and f_ decipherer task list
app.libs.swap_solutions = require('./lib/Decipherer/lib/swap_solutions.js')(app);
app.libs.Decipherer = require('./lib/Decipherer')(app);


// Require downloads collection and assign shorthand to app namespace
app.libs.downloads = require('./lib/collections/downloads');
app.downloads = app.libs.downloads;

// Require Download f_ task list constructor and
// assign shorthand to app namespace
app.libs.Download = require('./lib/constructors/Download')(app);
app.Download = app.libs.Download;


////////////////////// Download fixture(s) \\\\\\\\\\\\\\\\\\\\\
setTimeout(function (){
  var dl1 = app.modules.f_.setup(new app.Download({v: '_QeZVUO0DP0'}));
      //dl2 = app.modules.f_.setup(new app.Download({v: '-n00X3fase4'}));

  dl1.start();
  //dl2.start();

  app.downloads
    .add(dl1)
    //.add(dl2);
}, 500);
////////////////////// Download fixture(s) \\\\\\\\\\\\\\\\\\\\\


// Require HTTP functionality
app.libs.http = require('./lib/servers/http')(app);
app.http_api.router = app.libs.http.router;
app.http_api.handlers = app.libs.http.handlers;

// Setup routes
app.http_api.router
  .get('/downloads', app.http_api.handlers.getAll)
  .get('/downloads/:id', app.http_api.handlers.getById)
  .post('/downloads/:v', app.http_api.handlers.postNew)
  .delete('/downloads/:id', app.http_api.handlers.deleteById);

// Create server and start listening
app.http_api.server =
  app.libs.http.create(app.http_api.router.listener)
    .listen(app.params.http_api_port);

app.http_api_log('Server listening at port ' + app.params.http_api_port);


// Start up/time notifier
app.ready_time = new Date().getTime();
app.time_taken = app.ready_time - app.start_time;

app.log('Ready for business, launch time: ' + app.time_taken + 'ms');