/**
 * App HTTP server functionality
 */
module.exports = function (){

  return {
    create: require('./lib/create.js'),
    listener: require('./lib/listener.js')
  };

}();