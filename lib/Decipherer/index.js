/**
 * @return {constructor} Decipherer
 */
module.exports = function (app){
  app = app || {};

  /**
   * @public
   * @constructor
   * @param {object} o - Options
   */
  var Decipherer = function (o){
    o = o || {};
    for(var k in o) this[k] = o[k];

    return this;
  };


  Decipherer.prototype.start = function (){
    this.f_next();
  };

  /**
   * HTTPS get html5player.js
   * @method
   * @public
   */
  Decipherer.prototype.gethtml5player = function (){
    var self = this,
        dl = self.dl;

    app.modules.https.get(dl.html5player_url, function (res){
      var b = ''; res.on('data', function (c){ b += c; });

      res.on('end', function (){
        if(b.length < 5000)
          return self.f_retry('@gethtml5player: b.length < 5000');

        self.d.html5player = b;

        self.f_next();
      });

    }).on('error', function (err){
      return self.f_retryAll('@gethtml5player: https.get error');
    });
  };

  /**
   * Gets the decipher function name
   * @method
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
   * Find the decipher function expression and its body
   * @method
   */
  Decipherer.prototype.getDecipherStrings = function (){
    // Get the whole function expression
    var decipherer_match_re = new RegExp("function "
      + this.d.decipher_fn + '\(.+?\)\{.+?return.+?\}', 'g');

    var decipher_match = decipherer_match_re.exec(this.d.html5player);

    if(!decipher_match || decipher_match.length === 0)
      return this.f_retryAll("@getDecipherFunction: couldn't"
        + " find decipher function");

    this.d.decipher_function_str = decipher_match[0];

    // We can be sure this succeeds, since we passed the code above
    // fn(){(..CAPTURE..)}
    this.d.decipher_function_body =
       /.+?\{(.+?)\}/.exec(this.d.decipher_function_str)[1];

    this.f_next();
  };


  Decipherer = app.modules.f_.augment(Decipherer, {
    function_flow: [
      'gethtml5player',
      'getDecipherFn',
      'getDecipherStrings'
    ],
    error_array: 'errs',
    //desc: 'download->decipherer',
    to_log: (app.params.use_log ? ['all'] : ['silent'])
  });

  return Decipherer;
};