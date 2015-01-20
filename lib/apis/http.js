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
      qs = url.split('?')[1],
      method = req.method;


  app.log(method + ' request ' + url);


  // Request end helper function
  function end(response){
    res.end(JSON.stringify(response));
  }


  function GET(){
    if(url.indexOf('/downloads') !== -1){
      var id = /\/.+?\/(.+)/.exec(url);
      if(id) id = id[1];

      if(id) return end({
        status: 'succes',
        data: app.downloads.getStats(id)
      }); 
      else return end({
        status: 'succes',
        data: app.downloads.getStats()
      }); 
    }
  }

  function POST(){
    if(url.indexOf('/downloads') !== -1){
      var params = app.qs.parse(qs);

      if(!params.v)
        return end({
          status: 'failed',
          desc: 'No video parameter: v'
        });
    }
  }

  function DELETE(){
    if(url.indexOf('/downloads') !== -1){
      var id = /\/.+?\/(.+)/.exec(url);
      if(id) id = id[1];

      if(id) return; // Return a single download by id
      else return; // Return all downloads
    }
  }


  switch(method){
    case 'GET':    GET();    break;
    case 'POST':   POST();   break;
    case 'DELETE': DELETE(); break;
    default: ;
  }

};