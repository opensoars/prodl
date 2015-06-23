module.exports = function (app){
  app = app || {};

  var modules = app.modules,
      cls = modules.cls,
      Ezlog = modules.Ezlog;

  if(app.params.use_log){
    app.log = new Ezlog(['[prodl]', 'green']);
    app.logErr = new Ezlog(['[prodl]', 'green'], ['red']);
    app.logWarn = new Ezlog(['[prodl]', 'green'], ['yellow']);

    app.dump_log = new Ezlog(['[dump]', 'blue']);
    app.dump_logErr = new Ezlog(['[dump]', 'blue'], ['red']);

    app.http_api_log = new Ezlog(['[HTTP API]', 'blue', 'bold']);
    app.http_api_logErr = new Ezlog(['[HTTP API]', 'blue', 'bold'], ['red']);
    app.http_api_logWarn = new Ezlog(['[HTTP API]', 'blue', 'bold'], ['yellow']);

    app.download_log = new Ezlog(['[download]', 'yellow']);
    app.download_logErr = new Ezlog(['[download]', 'yellow'], ['red']);
    app.download_logWarn = new Ezlog(['[download]', 'yellow'], ['yellow', 'bold']);

    app.decipherer_log = new Ezlog(['[decipherer]', 'yellow']);
    app.decipherer_logErr = new Ezlog(['[decipherer]', 'yellow'], ['red']);
    app.decipherer_logWarn = new Ezlog(['[decipherer]', 'yellow'], ['yellow', 'bold']);
  }
  else {
    function empty (){}

    app.log = empty;
    app.logErr = empty;
    app.logWarn = empty;

    app.dump_log = empty;
    app.dump_logErr = empty;

    app.http_api_log = empty;
    app.http_api_logErr = empty;
    app.http_api_logWarn = empty;

    app.download_log = empty;
    app.download_logErr = empty;
    app.download_logWarn = empty;
  }

  return app;
};