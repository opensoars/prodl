module.exports = function (app){
  app = app || {};

  function makeResponse(o){
    o = o || {};

    var response = {
      handle_time: new Date().getTime(),
      data: null
    };

    for(var k in o) response[k] = o[k];

    return response;
  }

  /**
   * @public
   */
  return {

    getAll: function (req, res){
      var downloads = app.downloads.get(),
          response = makeResponse({url: req.url});

      if(downloads){
        response.data = [];
        for(var id in downloads){
          var download_result = { id: id };
          for(var prop in downloads[id])
            download_result[prop] = downloads[id][prop];

          // delete download_result.d (f_ data namespace)
          delete download_result.d;

          response.data.push(download_result);
        }
      }

      res.json(response);
    },
    getById: function (req, res){
      var download = app.downloads.get(req.params.id),
          response = makeResponse({url: req.url});

      if(download){
        download.id = req.params.id;
        response.data = download;

        // delete download.d (f_ data namespace)
        delete response.data.d;
      }

      res.json(response);
    },
    postNew: function (req, res){
      var response = makeResponse({url: req.url});

      response.status = 'success';
      if(!req.params.v) response.status = 'fail'

      /**
       * Are we going to allow multiple downloads with the same video id?
       * For now, we're going to allow it. But we will notify the user if
       * it is already there
       */
      //var found_download = app.downloads.get()

      var download = new app.Download({
        v: req.params.v
      });

      download = app.modules.f_.setup(download);
      download.start();

      app.downloads.add(download);

      res.json(response);
    }

  };

};