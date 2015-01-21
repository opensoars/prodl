var app = process.app;

/**
 * Helper function isApiCall
 */



var isApiCall = function (){
  var api_url_re = app.api.http.url_re,
      api_url = app.api.http.url;

  return function (url){
    if(!api_url_re.test(url))
      return false;

    if(url.length === 4
      && url.charAt(url.length - 1) !== api_url.charAt(api_url.length - 1) )
      return false;

    if(url.length > 4 && url.charAt(api_url.length) !== '/')
      return false;
      
    return true;
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
    res_json.req_url = url;

    res.writeHead(200, {'Content-type': 'application/json'});
    res.end(JSON.stringify(res_json));
  }

  if(isApiCall(url)){
    app.log('API ' + method + ' ' + url);

    endJSON();
  }
  else {
    // Handle anything but an API call
    res.end('.');
  }

};