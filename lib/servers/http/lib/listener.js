/*module.exports = function (app, router) {

  app = app || {};

  var cls = app.modules.cls;
*/
  /**
   * Helper function isApiCall
   */
/*  var isApiCall = (function () {
    var api_url = app.http_api.base;
    return function (url) {
      if (!api_url_re.test(url) || url.length === 4 &&
          url.charAt(url.length - 1) !== api_url.charAt(api_url.length - 1) ||
          url.length > 4 && url.charAt(api_url.length) !== '/') {
        return false;
      }
      return true;
    }
  }());*/

  /**
   * Helper function logApiReq
   */
/*  var logApiReq = (function (){
    return function (method, url) {
      var str = cls(method, 'magenta'),
          i;
      for(i = 0; i < (8 - method.length); i += 1) {
        str += ' ';
      }
      str += url;
      app.api.http.log(str);
    };
  }());*/

  /**
   * HTTP listener function
   */
 /* return function listener(router) {

    return function (req, res) {
      var url = req.url,
          method = req.method;

      // Request end helper function
      function endJSON(res_json) {
        res_json = res_json || {};

        // Default response
        res_json.date = new Date().getTime();
        res_json.request = { url: url, method: method };

        res.writeHead(200, {'Content-type': 'application/json'});
        res.end(JSON.stringify(res_json));
      }

      if (isApiCall(url)) {
        logApiReq(method, url);
        endJSON();
      }
      else {
        // Handle anything but an API call
        res.writeHead(404);
        res.end('Nothing here!');
      }
    }

  };

};

*/