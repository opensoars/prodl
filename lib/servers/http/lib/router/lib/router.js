module.exports = function (app){
  app = app || {};

  var fs = app.modules.fs,
      cls = app.modules.cls;

  /**
   *
   * Helpers
   *
   */

  /**
   * @desc Removes empty strings from an array with strings
   * @param {array} arr - Array to remove empty strings from
   * @private
   * @return {array} arr - Without empty string elements
   */
  function removeEmptyStrings(arr){
    return arr instanceof Array
      ? (function (arr){
          for(var i in arr)
            if(arr[i] === '') arr.splice(i, 1);
          return arr;
        }(arr))
      : (function (){
        throw new Error('argument 1 has to be an array');
      }());
  }

  /**
   * @desc Checks whether 2 given arrays are of the same length
   * @param {array} a
   * @param {array} b
   * @return {bool} - Wheter the two arrays given have the same length
   * @private
   */
  function haveSameLength(a, b){
    a = a instanceof Array || a instanceof String ? a : '';
    b = b instanceof Array || b instanceof String ? b : '';
    return a.length == b.length;
  }

  /**
   * @desc Split an array by /
   * @param {string} url - Url string to split
   * @return {array} - Url which has been split into segments
   * @private
   */
  function splitUrl(url){
    return removeEmptyStrings(url.indexOf('/') == -1 ? [] : url.split('/'));
  }

  /**
   * @desc 
   * @private
   */
  function getUrlParams(url, pattern){

    url = url || '';
    pattern = pattern || '';
    var url_segments = splitUrl(url),
        search_segments = splitUrl(pattern)
        search_params = [],
        result = {};

    url_segments = removeEmptyStrings(url_segments);
    search_segments = removeEmptyStrings(search_segments);

    if(!haveSameLength(url_segments, search_segments))
      return null;

    search_segments.forEach(function (segment, i){
      if(segment.charAt(0) === ':')
        result[segment.replace(':', '')] = url_segments[i];
    });

    return result;
  }

  var getApiLogStr = function (){
    return function (method, url){
      var str = cls(method, 'magenta');
      for(var i=0; i < (8 - method.length); i+=1) str += ' ';
      str += url;
      return str;
    }
  }();

  /**
   * @desc Checks whether an given url matches with a specified route pattern
   * @param {string} url - Url to compare route with
   * @param {string} route - Route to compare url with
   * @return {boolean} all_segments_match
   * @example
   * patternMatches('/api/books/5', '/:product/:id');           // true
   * patternMatches('/api/books/thrillers/5', '/:product/:id'); // false
   * @private
   */
  function patternMatches(url, route){
    url = url || ''; route = route || '';
    var url_segments = splitUrl(url),
        route_segments = splitUrl(route),
        all_segments_match = true;

    // Remove 'api' segment
    url_segments.splice(0, 1);

    if(haveSameLength(url_segments, route_segments)){

      url_segments.forEach(function (url_segment, i){
        var route_segment = route_segments[i];

        // route_segment is NOT a param segment
        if(route_segment.charAt(0) != ':')
          if(url_segment != route_segment)
            all_segments_match = false;
      });
    }
    else
      all_segments_match = false;
    
    return all_segments_match;
  }


  function handleStatic(req, res){
    var url = req.url.replace(/\/static/, '');
    if(url == '/') url = '/index.html';

    var requested_file = app.static_api.dir + url;

    // Try to read requested file
    fs.readFile(requested_file, function (err, file_found){
      // If the requested file could not be read
      if(err){
        res.writeHead(404, {'Content-type': 'text/html'});
        // Try to read 404.html
        fs.readFile(app.static_api.dir + '/404.html', function (err, file_404){
          // If 404 page could not be read end with basic HTML
          if(err)
            return res.end("<h1>404</h1>");
          // Else we end with the read 404 page
          res.end(file_404);
        });
      }
      // If the requested file could be read end with it
      else{
        res.writeHead(200, {'Content-type': 'text/html'});
        res.end(file_found);
      }
    });
  }


  /**
   * Router public namespace
   */
  var router = {
    routes: {
      GET: {},
      PUT: {},
      POST: {},
      DELETE: {}
    }
  };

  router.get = function (url, toCall){
    if(typeof url != 'string')
      throw 'router.get needs an url string as its 1st argument';
    if(typeof toCall != 'function')
      throw 'router.get needs a callback function as its 2nd argument';
    this.routes.GET[url] = toCall;
    return this;
  };

  router.post = function (url, toCall){
    if(typeof url != 'string')
      throw 'router.post needs an url string as its 1st argument';
    if(typeof toCall != 'function')
      throw 'router.post needs a callback function as its 2nd argument';

    this.routes.POST[url] = toCall;

    return this;
  };


  router.listener = function (req, res){

    var url = req.url == '/' ? '/static' : req.url,
        method = req.method,
        req_segments = splitUrl(url),
        first_segment = req_segments[0];

    req_segments.splice(0, 1);

    if(first_segment == app.http_api.base.replace(/\//, '')){

      var matching_route;
      for(var route in router.routes[req.method])
        if(patternMatches(url, route))
          matching_route = route;

      if(matching_route){

        req.params = getUrlParams('/' + req_segments.join('/'), matching_route);

        res.json = function (res_json){
          this.writeHead(200, {'Content-type': 'application/json'});

          if( !(res_json instanceof Object) )
            throw 'res.json could not parse JSON';

          try{ res_json = JSON.stringify(res_json); }
          catch(e){ throw 'res.json could not parse JSON'; }

          this.end(JSON.stringify(res_json));
        }

        router.routes[req.method][matching_route](req, res);
      }
      else{
        res.end('could not ' + method + ' ' + url);
      }

    }
    else if(first_segment == app.static_api.base.replace(/\//g, '')){
      if(app.static_api && app.static_api.dir)
        handleStatic(req, res);
      else
        res.end('No static file server enabled.');
    }
    else{
      res.writeHead(404);
      res.end('');
    }

  }

  return router;

};