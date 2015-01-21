(function (){
  var app = process.app;

  if(app.params.log){
    app.log = new app.modules.Ezlog(['[app]', 'green']);
    app.logErr = new app.modules.Ezlog(['[app]', 'green'], ['red']);
    app.logWarn = new app.modules.Ezlog(['[app]', 'green'], ['yellow']);

    app.api.http.log =  new app.modules.Ezlog(['[HTTP API]', 'blue', 'bold']);
  }
  else {
    var empty_function = function (){};

    app.log = empty_function;
    app.logErr = empty_function;
    app.logWarn = empty_function;

    app.api.http.log = empty_function
  }
}());