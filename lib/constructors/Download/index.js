module.exports = function (app){
  var app = app || {},
      use_log = app.params.use_log,
      log = app.download_log,
      logErr = app.download_logErr,
      logWarn = app.download_logWarn;

  /**
   * @public
   * @constructor
   * @param {object} o - Options
   */

  function Download(o){
    o = o || {};
    for(var k in o) this[k] = o[k];

    this.start_time = new Date().getTime();
  }

  Download.prototype.start = function (){
    if(use_log)
      log('Starting: ' + this.v);

    this.f_next();
  };

  Download.prototype.test1 = function (){
    this.f_next();
  };

  Download.prototype.test2 = function (){
    this.f_next();
  };

  Download = app.modules.f_.augment(Download, {
    function_flow: ['test1', 'test2'],
    error_array: 'errs',
    data_namespace: 'd',
    desc: 'download',
    to_log: (use_log ? ['all'] : ['silent'])
  });

  return Download;

};