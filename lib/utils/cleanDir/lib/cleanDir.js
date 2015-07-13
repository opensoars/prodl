module.exports = function (app) {

  var fs = app.modules.fs;

  /**
   * Cleans a given directory in the prodl directory.
   * @module lib/utils/cleanDir
   * @param {string} to_clean - Directory to remove top level files from
   */
  return function cleanDir (to_clean) {

    app.log('cleanDir ' + to_clean);

    if(!to_clean)
      return spp.logErr('Expected a prodl directry as argument 1');

    fs.readdir(app.__dirname + to_clean, function (err, dirs) {
      dirs.forEach(function (entry){
        fs.unlink(app.__dirname + to_clean + '/' + entry, function (err){
          if(err)
            app.logWarn('Could not remove ' + to_clean + '/' + entry);
          
          app.log('Removed ' + app.__dirname + to_clean + '/' + entry);
        });
      });
    });
  };

};