var http = require('http');

/**
 * App HTTP server functionality
 */
module.exports = function (){


  function create(listener){
    return http.createServer(listener);
  }


  return {
    create: create
  };

}();