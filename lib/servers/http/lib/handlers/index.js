module.exports = function (app){
  app = app || {};


  /**
   * Helper function that makes the creation of response objects easy.
   * @param {object} res_data - Data to add to the response object
   * @private
   */
  function makeResponse (res_data){
    res_data = res_data || {};

    var response = {
      handle_time: new Date().getTime(),
      data: null
    };

    for (var k in res_data) {
      if (res_data.hasOwnProperty(k)) {
        response[k] = res_data[k];
      }
    }

    return response;
  }

  /**
   * @public
   */
  return {

    getAll: function (req, res){
      var downloads = app.downloads.get(),
          response = makeResponse({url: req.url});

      if (downloads) {
        response.data = [];
        for (var id in downloads) {
          var download_result = { id: id };
          for (var prop in downloads[id])
            download_result[prop] = downloads[id][prop];

          /**
           * We're gonna end the request with the data returned by
           * by downloads.getStats().
           */

          // delete download_result.d (f_ data namespace)
          delete download_result.d;

          response.data.push(download_result);
        }
      }

      res.json(response);
    },
    getById: function (req, res) {
      var download = app.downloads.get(req.params.id),
          response = makeResponse({url: req.url});

      if (download) {
        download.id = req.params.id;
        response.data = download;

        /**
         * We're gonna end the request with the data returned by
         * by downloads.getStats().
         */

        // delete download.d (f_ data namespace)
        delete response.data.d;
      }

      res.json(response);
    },
    postNew: function (req, res) {
      var response = makeResponse({url: req.url});
      response.status = 'fail';

      if (!req.params.v) {
        response.desc = 'No video id received';
        res.json(response);
      }
      else if (typeof req.params.v !== 'string') {
        response.desc = 'Wrong video id type: ' + typeof req.params.v +
          ', not a string';
        res.json(response);
      }
      else if (req.params.v.length !== 11) {
        response.desc = 'Wrong video id length: ' + req.params.v.length +
          ', not 11';
        res.json(response);
      }

      else {
        // If a download is already present by video id: v
        if (app.downloads.getByV(req.params.v)) {
          response.desc = 'Download already present';
          res.json(response);
        }
        else {
          response.status = 'succes';

          app.downloads.add(
            app.modules.f_.setup(
              new app.Download({ v: req.params.v })
            ).start()
          );

          res.json(response);
        }

      }
    },

    deleteById: function (req, res) {
      var response = makeResponse({url: req.url});

      response.status = 'success';
      if(!req.params.id) {
        response.status = 'fail';
      }

      app.downloads.delete(req.params.id);

      res.json(response);
    }

  };

};