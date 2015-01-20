/**
 * Resources:
 *
 * GET /downloads
 * GET /downloads/id
 *
 * POST /downloads
 */

/**
 * HTTP API (listener function)
 *
 * PUT will not be used, since there is no update functionality
 */
module.exports = function (req, res){
  var app = process.app;

  var url = req.url,
      method = req.method;


  app.log(method + ' request ' + url);


  function GET(){

  }

  function POST(){
    if(url.indexOf('/downloads') !== -1){

    }
  }

  function DELETE(){
    
  }


  switch(method){
    case 'GET':    GET();    break;
    case 'POST':   POST();   break;
    case 'DELETE': DELETE(); break;
    default: ;
  }

};