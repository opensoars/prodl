var app = process.app,
    cls = app.modules.cls;

/**
 * Helper function isApiCall
 */
var isApiCall = function (){
  var api_url_re = app.api.http.url_re,
      api_url = app.api.http.url;

  return function (url){
    if(!api_url_re.test(url)
       || url.length === 4 &&
          url.charAt(url.length - 1) !== api_url.charAt(api_url.length - 1)
       || url.length > 4 && url.charAt(api_url.length) !== '/'
      )
      return false;

    return true;
  }
}();

/**
 * API request logging helper
 */
var logApiReq = function (){

  var log = app.api.http.log;

  return function (method, url){
    var str = cls(method, 'magenta');

    for(var i=0; i < (8 - method.length); i+=1) str += ' ';
    str += url;

    log(str);
  }

}();


/**
 * HTTP listener function
 *
 * @param req {object}  HTTP request
 * @param res {object}  HTTP response
 */
module.exports = function listener(req, res){
  var app = process.app;

  var url = req.url,
      qs = url.split('?')[1],
      method = req.method;

  // Request end helper function
  function endJSON(res_json){
    res_json = res_json || {};

    // Default response
    res_json.date = new Date().getTime();
    res_json.request = { url: url, method: method };

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end(JSON.stringify(res_json));
  }

  if(isApiCall(url)){
    logApiReq(method, url);

    endJSON();
  }
  else {
    // Handle anything but an API call
    res.end('Nothing here!');
  }

};