/**
 * Returns application logger functions which can be looped through.
 * @module lib/loggers
 * @param {object} app - App namespace
 * @return {array} loggers - Application loggers
 * @example
 * // Usage example
 * require('./lib/loggers')(app).forEach(function (log_obj){
 *   for(log_type in log_obj) app[log_type] = log_obj[log_type];
 * });
 * @example
 * // Return value example
 * [ { log: function(){}, logWarn: function(){}, logErr: function(){} } ]
 */
module.exports = function (app){
  app = app || {};

  var cls = app.modules.cls,
      Ezlog = app.modules.Ezlog;

  var loggers = [];


  if(app.params.use_log){

    loggers.push(
      { name: 'log', func: new Ezlog(['[prodl]', 'green']) },
      { name: 'logErr', func: new Ezlog(['[prodl]', 'green'], ['red']) },
      { name: 'logWarn', func: new Ezlog(['[prodl]', 'green'], ['yellow']) },
      { name: 'dump_log', func: new Ezlog(['[dump]', 'blue']) },
      { name: 'dump_logErr', func: new Ezlog(['[dump]', 'blue'], ['red']) },
      { name: 'http_log', func: new Ezlog(['[HTTP]', 'blue', 'bold']) },
      { name: 'http_logErr', func: new Ezlog(['[HTTP]', 'blue', 'bold'], ['red']) },
      { name: 'http_logWarn', func: new Ezlog(['[HTTP]', 'blue', 'bold'], ['yellow']) },
      { name: 'http_api_log', func: new Ezlog(['[HTTP API]', 'blue', 'bold']) },
      { name: 'http_api_logErr', func: new Ezlog(['[HTTP API]', 'blue', 'bold'], ['red']) },
      { name: 'http_api_logWarn', func: new Ezlog(['[HTTP API]', 'blue', 'bold'], ['yellow']) },
      { name: 'download_log', func: new Ezlog(['[download]', 'yellow']) },
      { name: 'download_logErr', func: new Ezlog(['[download]', 'yellow'], ['red']) },
      { name: 'download_logWarn', func: new Ezlog(['[download]', 'yellow'], ['yellow', 'bold']) },
      { name: 'downloads_log', func: new Ezlog(['[downloads]', 'yellow']) },
      { name: 'downloads_logErr', func: new Ezlog(['[downloads]', 'yellow'], ['red']) },
      { name: 'downloads_logWarn', func: new Ezlog(['[download]', 'yellow'], ['yellow', 'bold']) },
      { name: 'decipherer_log', func: new Ezlog(['[decipherer]', 'yellow']) },
      { name: 'decipherer_logErr', func: new Ezlog(['[decipherer]', 'yellow'], ['red']) },
      { name: 'decipherer_logWarn', func: new Ezlog(['[decipherer]', 'yellow'], ['yellow', 'bold']) }
    );

  }
  else {
    function empty (){}

    loggers.push(
      { name: 'log', func: empty},
      { name: 'logErr', func: empty},
      { name: 'logWarn', func: empty},
      { name: 'dump_log', func: empty},
      { name: 'dump_logErr', func: empty},
      { name: 'http_log', func: empty},
      { name: 'http_logErr', func: empty},
      { name: 'http_logWarn', func: empty},
      { name: 'http_api_log', func: empty},
      { name: 'http_api_logErr', func: empty},
      { name: 'http_api_logWarn', func: empty},
      { name: 'download_log', func: empty},
      { name: 'download_logErr', func: empty},
      { name: 'download_logWarn', func: empty},
      { name: 'downloads_log', func: empty},
      { name: 'downloads_logErr', func: empty},
      { name: 'downloads_logWarn', func: empty},
      { name: 'decipherer_log', func: empty},
      { name: 'decipherer_logErr', func: empty},
      { name: 'decipherer_logWarn', func: empty}
    );
  }

  return loggers;
};