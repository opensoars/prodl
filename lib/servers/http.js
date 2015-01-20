var http = require('http');


module.exports = function (){


  function create(listener){
    return http.createServer(listener);
  }
  

  return {
    create: create
  };

}();