/**
 * Note there is no 80 characters limit here.
 * Since this can been seen as a simple config file.
 */
(function (){
  var app = process.app,
      modules = app.modules,
      Ezlog = modules.Ezlog;

  if(app.params.log){
    app.log = new Ezlog(['[app]', 'green']);
    app.logErr = new Ezlog(['[app]', 'green'], ['red']);
    app.logWarn = new Ezlog(['[app]', 'green'], ['yellow']);

    app.api.http.log =  new Ezlog(['[HTTP API]', 'blue', 'bold']);
    app.api.http.logErr = new Ezlog(['[HTTP API]', 'blue', 'bold'], ['red']);
    app.api.http.logWarn = new Ezlog(['[HTTP API]', 'blue', 'bold'], ['yellow']);

    app.dump.log = new Ezlog(['[dump]', 'blue']);
    app.dump.logErr = new Ezlog(['[dump]', 'blue'], ['red'])
  }
  else {
    var emptyFunction = function (){};

    app.log = emptyFunction;
    app.logErr = emptyFunction;
    app.logWarn = emptyFunction;

    app.api.http.log = emptyFunction;
    app.api.http.logErr = emptyFunction;
    app.api.http.logWarn = emptyFunction;

    app.dump.log = emptyFunction;
    app.dump.logErr = emptyFunction;
  }
}());