module.exports = function (app){
  app = app || {};

  var modules = app.modules,
      cls = modules.cls,
      Ezlog = modules.Ezlog;

  if(app.params.use_log){
    app.log = new Ezlog(['[app]', 'green']);
    app.logErr = new Ezlog(['[app]', 'green'], ['red']);
    app.logWarn = new Ezlog(['[app]', 'green'], ['yellow']);

    app.dump_log = new Ezlog(['[dump]', 'blue']);
    app.dump_logErr = new Ezlog(['[dump]', 'blue'], ['red']);

    app.http_api_log = new Ezlog(['[HTTP API]', 'blue', 'bold']);
    app.http_api_logErr = new Ezlog(['[HTTP API]', 'blue', 'bold'], ['red']);
    app.http_api_logWarn = new Ezlog(['[HTTP API]', 'blue', 'bold'], ['yellow']);
  }
  else {
    app.log = function (){};
    app.logErr = function (){};
    app.logWarn = function (){};

    app.dump_log = function (){};
    app.dump_logErr = function (){};
  }

  return app;
};