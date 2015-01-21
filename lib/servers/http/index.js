/**
 * App HTTP server functionality
 */
module.exports = function (){

  process.app.api.http.log('Initializing...');

  return {
    create: require('./lib/create.js'),
    listener: require('./lib/listener.js')
  };

}();