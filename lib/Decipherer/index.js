/**
 * f_ Decipherer task list.
 * @param {object} app - Top level application namespace
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
    for (var k in o) {
      if (o.hasOwnProperty(k)) {
        this[k] = o[k];
      }
    }

    return this;
  };

  /**
   * 
   */
  Decipherer.prototype.start = function (){
    this.f_next();
  };

  /**
   * @desc HTTPS get html5player.js
   * @method
   * @public
   */
  Decipherer.prototype.gethtml5player = function (){
    var self = this,
        dl = self.dl;

    app.modules.https.get(dl.html5player_url, function (res){
      var b = '';
      res.on('data', function (c){
        b += c;
      });

      res.on('end', function (){
        if (b.length < 5000) {
          return self.f_retry('@gethtml5player: b.length < 5000');
        }

        self.d.html5player = b;

        self.f_next();
      });

    }).on('error', function (err){
      return self.f_retryAll('@gethtml5player: https.get error', err);
    });
  };

  /**
   * @desc Gets the decipher function name
   * @method
   * @public
   */
  Decipherer.prototype.getDecipherFn = function () {
    var html5player = this.d.html5player;

    var decipher_call = 
      /if\(.+\..+?\|\|.\..+?\){var .+?=.+?.sig\|\|.+?\(.+?\..+?\)/
      .exec(html5player);

    if (!decipher_call.length) {
      return this.f_retryAll('@getDecipherFn: !decipher_call.length');
    }
    if (decipher_call[0].length < 10) {
      return this.f_retryAll('@getDecipherFn: decipher_call[0].length < 10');
    }

    decipher_call = decipher_call[0];
    this.d.decipher_call = decipher_call;

    var fn = /if\(.+\..+?\|\|.\..+?\){var .+?=.+?.sig\|\|(.+?)\(.+?\..+?\)/
      .exec(decipher_call)[1];

    if (fn.charAt(0) === '$') {
      fn = '\\' + fn;
    }

    this.d.decipher_fn = fn;

    this.f_next();
  };

  /**
   * @desc Find the decipher function expression and its body
   * @method
   * @public
   */
  Decipherer.prototype.getDecipherStrings = function () {
    // Get the whole function expression
    var decipherer_match_re = new RegExp("function "
      + this.d.decipher_fn + '\(.+?\)\{.+?return.+?\}', 'g');

    var decipher_match = decipherer_match_re.exec(this.d.html5player);

    if (!decipher_match || decipher_match.length === 0) {
      return this.f_retryAll("@getDecipherFunction: couldn't" +
        " find decipher function");
    }

    this.d.decipher_function_str = decipher_match[0];

    // We can be sure this succeeds, since we passed the code above
    // fn(){(..CAPTURE..)}
    this.d.decipher_function_body =
       /.+?\{(.+?)\}/.exec(this.d.decipher_function_str)[1];

    this.f_next();
  };

  /**
   * @desc Sometimes a swap function is called from the decipher function.
   * In order to make sure we only get one function for evaluation we inline
   * the swapper function in the decipher function.
   * @method
   * @public
   */
  Decipherer.prototype.findSolution = function () {
    var decipher_function_body = this.d.decipher_function_body;

    this.d.decipher_function_body_1st_char = decipher_function_body.charAt(0);

    // ;ze.cd(a,5);  Note everything is between semicolons ;...;
    var scoped_manip = /\;.{1,3}\..{1,3}\(.{1,3}\,.{1,3}\)\;/g
      .test(decipher_function_body);

    // a=ze.cd(a,5)
    var namespaced_var_manip = /.{1,3}=.{1,3}\..{1,3}\(.+?,.+?\)/g
      .test(decipher_function_body);

    // a=ze(a,g);
    var var_manip = /.{1,3}=(.+?)\(.+?,.+?\);/g
      .test(decipher_function_body);

    var solution;

    if (scoped_manip) {
      solution = 'scoped_manip';
    }
    else if (namespaced_var_manip) {
      solution = 'namespaced_var_manip';
    }
    else if (var_manip) {
      solution = 'var_manip';
    }
    else {
      return this.f_retryAll('@findSolution: no swapper solution'); 
    }

    if (!app.libs.swap_solutions[solution]) {
      return this.f_retryAll('@findSolution: no swapper solution');
    }

    this.d.solution = solution;

    this.f_next();
  };

  Decipherer.prototype.applySolution = function () {
    var decipher_body;

    try {
      decipher_body = app.libs.swap_solutions[this.d.solution](
        this.d.decipher_function_body,
        this.d.html5player,
        this
      );
    }
    catch(e) {
      return this.f_retryAll(
        '@applySolution: failed to execute the solution', e
      );
    }

    this.d.decipher_body = decipher_body;

    this.f_next();
  };

  Decipherer.prototype.createDecipherFunc = function (){

    try {
      var decipherFunc = new Function(
        this.d.decipher_function_body_1st_char,
        this.d.decipher_body
      );

      this.d.decipherFunc = decipherFunc;
      this.f_next();
    }
    catch(e) {
      return this.f_retryAll(
        '@createDecipherFunc: failed to create decipher function', e
      );
    }


  };

  Decipherer.prototype.decipherSignature = function (){
    var deciphered_sig;

    try {
      deciphered_sig = this.d.decipherFunc(this.dl.ciphered_sig);
    }
    catch(e){
      return this.f_retryAll(
        '@decipherSignature: failed to decipher signature', e
      );
    }

    this.d.deciphered_sig = deciphered_sig;
    this.f_next();
  };

  Decipherer = app.modules.f_.augment(Decipherer, {
    function_flow: [
      'gethtml5player',
      'getDecipherFn',
      'getDecipherStrings',
      'findSolution',
      'applySolution',
      'createDecipherFunc',
      'decipherSignature'
    ],
    error_array: 'errs',

    //desc: 'download->decipherer',
    to_log: (app.params.use_log ? ['all'] : ['silent'])
  });

  return Decipherer;
};