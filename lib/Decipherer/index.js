module.exports = function (app){
  var use_log = app.params.use_log;


  var Decipherer = function (o){
    o = o || {};

    this.dl = o.dl;
  };

  Decipherer.prototype.start = function (){
    this.f_next();
  };

  Decipherer.prototype.gethtml5player = function (){
    var self = this,
        dl = self.dl;

    app.modules.http.get(dl.html5player_url, function (res){
      var b = ''; res.on('data', function (c){ b += c; });

      res.on('end', function (){
        console.log(b.length);
      })

    }).on('error', function (err){

    });
  };

  Decipherer = app.modules.f_.augment(Decipherer, {
    function_flow: ['gethtml5player'],
    error_array: 'errs',
    desc: 'Download->Decipherer',
    to_log: (use_log ? ['all'] : ['silent'])
  });

  return Decipherer;
};