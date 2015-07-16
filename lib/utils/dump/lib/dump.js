module.exports = function (app){
  app = app || {};

  var modules = app.modules;

  var log = app.dump_log,
      logErr = app.dump_logErr;

  /**
   * dump API
   */
  return {
    create: function (o){
      var dir;

      o = o || {};

      if(!o.dir){
        logErr('Could not initialize dump, no dir given');
        return function (){};
      }

      dir = o.dir;

      /**
       * Public dump function. Uses .dump file extension.
       *
       * @param fn   {string}                File name
       * @param data {string|buffer|object}  Data to dump
       */
      return function (fn, data){
        var temp_data;

        if(!fn)
          return logErr('Dump needs a file name as its first argument');
        if(!data)
          return logErr('Dump needs data as its 2nd argument');
        if(typeof data !== 'object' && typeof data !== 'string')
          return logErr('Data arguments not of type object|string|buffer');

        // Stringify if JSON
        if(typeof data === 'object' && (data instanceof Buffer === false))
          data = JSON.stringify(data, undefined, 2);
        
        modules.fs.writeFile(dir + fn + '.dump', data, function (err){
          if(err)
            return logErr('Could not dump file: ' + fn, err);

          log('Dumped file: ' + fn);
        });
      };

    }
  };
};
