module.exports = function (app){
  var use_log = app.params.use_log;


  var Decipherer = function (o){
    o = o || {};

    for(var k in o)
      this[k] = o[k];

    return this;
  };

  Decipherer.prototype.start = function (){
    this.f_next();
  };

  /**
   * 
   */
  Decipherer.prototype.gethtml5player = function (){
    var self = this,
        dl = self.dl;

    app.modules.http.get(dl.html5player_url, function (res){
      var b = ''; res.on('data', function (c){ b += c; });

      res.on('end', function (){
        if(b.length < 5000)
          return self.f_retry('@gethtml5player: b.length < 5000');

        self.d.html5player = b;

        self.f_next();
      });

    }).on('error', function (err){
      return self.f_retryAll('@gethtml5player: http.get error');
    });
  };

  /**
   * 
   */
  Decipherer.prototype.getDecipherFn = function (){
    var html5player = this.d.html5player;

    var decipher_call = 
      /if\(.+\..+?\|\|.\..+?\){var .+?=.+?.sig\|\|.+?\(.+?\..+?\)/
      .exec(html5player);

    if(!decipher_call.length)
      return this.f_retryAll('@getDecipherFn: !decipher_call.length');
    if(decipher_call[0].length < 10)
      return this.f_retryAll('@getDecipherFn: decipher_call[0].length < 10');


    decipher_call = decipher_call[0];
    this.d.decipher_call = decipher_call;

    var fn = /if\(.+\..+?\|\|.\..+?\){var .+?=.+?.sig\|\|(.+?)\(.+?\..+?\)/
      .exec(decipher_call)[1];

    if(fn.charAt(0) === '$') fn = '\\' + fn;

    this.d.decipher_fn = fn;

    this.f_next();
  };

  /**
   * 
   */
  Decipherer.prototype.getDecipherFunction = function (){

    var decipherer_match_re = new RegExp("function "
      + this.d.decipher_fn + '\(.+?\)\{.+?return.+?\}', 'g');

    var decipher_match = decipherer_match_re.exec(this.d.html5player);

    if(!decipher_match || decipher_match.length === 0)
      return this.f_retryAll("@getDecipherFunction: couldn't"
        + " find decipher function");

    decipher_function_str = decipher_match[0];
    this.decipher_function_str = decipher_function_str;


    this.f_next();
  };

  /**
   * We can be sure this function succeeds, since we passed
   * the getDecipherFunction function 
   */
  Decipherer.prototype.getDecipherFunctionBody = function (){
    this.decipher_function_body =
       /.+?\{(.+?)\}/.exec(this.decipher_function_str)[1];

    this.f_next();
  };

  /**
   *
   * !! WORKING ON IT !!
   *
   */


  Decipherer = app.modules.f_.augment(Decipherer, {
    function_flow: [
      'gethtml5player',
      'getDecipherFn',
      'getDecipherFunction',
      'getDecipherFunctionBody'
    ],
    error_array: 'errs',
    //desc: 'download->decipherer',
    to_log: (use_log ? ['all'] : ['silent'])
  });

  return Decipherer;
};