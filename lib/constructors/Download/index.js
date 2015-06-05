/**
 * @return {constructor} Download
 */
module.exports = function (app){
  app = app || {};

  var dump = app.dump,
      https = app.modules.https,
      use_log = app.params.use_log,
      Decipherer = app.libs.Decipherer,
      log = app.download_log,
      logErr = app.download_logErr,
      logWarn = app.download_logWarn;

  /**
   * @desc f_ download task list constructor
   * @constructor
   * @param {object} o - Options
   * @public
   */
  function Download(o){
    o = o || {};
    for(var k in o) this[k] = o[k];

    this.dl_dir = app.params.dl_dir;
    this.temp_dir = app.temp_dir;

    return this;
  }

  /**
   * @desc Starts a download f_ task list if requirements are met
   * @method
   * @public
   */
  Download.prototype.start = function (){
    var self = this;

    self.f_start_time = new Date().getTime();

    // Check for required properties
    ['temp_dir', 'dl_dir', 'v'].forEach(function (property){
      if(!self[property])
        self.f_errs.push('Need ' + property + ' to start a download.');
    });

    if(self.f_errs.length !== 0)
      return self.f_abort('Errors @start');

    if(use_log)
      log('Starting: ' + self.v);

    // Update f_desc with video id
    self.f_desc = self.f_desc + ':' + self.v;

    self.f_next();

    // Allow chain calling?
    //return this;
  };

  /**
   * @desc HTTPS GET youtube video source code
   * @method
   * @public
   */
  Download.prototype.getSource = function (){
    var self = this;

    var options = {
      hostname: 'www.youtube.com',
      path: '/watch?v=' + self.v,
      method: 'GET'
    };

    var req = https.request(options, function (res){
      var src = '';

      res.setEncoding('utf8');

      res.on('data', function (chunk){
        src += chunk;
      });

      res.on('end', function (){
        if(src.length < 5000)
          return self.f_retryThis('@getSource: src.length < 5000');

        self.d.src = src;

        self.f_next();
      });
    })
    .on('error', function (err){
      return self.f_retryThis('@getSource: https error', err)
    })
    .end();

  };

  /**
   * @desc Extracts the ytplayer JS script from the youtube source code
   * @method
   * @public
   */
  Download.prototype.findYtPlayer = function (){
    var script_match = /<script>var ytplayer.+<\/script>/.exec(this.d.src),
        ytplayer = '';

    if(script_match.length)
      ytplayer = script_match[0];
    else
      return this.f_retryAll("@findYtPlayer: couldn't find ytplayer in d.src");

    ytplayer = ytplayer.replace(/<script>/, '');
    ytplayer = ytplayer.replace(/<\/script>/, '');

    if(ytplayer.length < 5000)
      return this.f_retryAll('@findYtPlayer: ytplayer.length < 5000');

    this.d.ytplayer = ytplayer;

    this.f_next();
  };

  /**
   * document.getElementById dummy function
   */
  var document = { getElementById: function (){ return { innerHTML: '' }; } };

  /**
   * @desc Evaluate ytplayer JS code in a scope sandbox
   * @method
   * @public
   */
  Download.prototype.evalYtPlayer = function (){
    var self = this;

    (function anon(self){
      try{ eval(self.d.ytplayer); }
      catch(e){
        return self.f_retryAll('@evalYtPlayer: eval(self.d.ytplayer) err', e);
      }

      if(!ytplayer)
        return self.f_retryAll('@evalYtPlayer: !ytplayer');
      if(typeof ytplayer !== 'object')
        return self.f_retryAll('@evalYtPlayer: typeof ytplayer !== object');

      self.d.ytplayer = ytplayer;

      self.f_next();
    }(self));

  };

  /**
   * 
   * @desc Gets the video title from the ytplayer JS
   * @method
   * @public
   */
  Download.prototype.getTitle = function (){
    var title = this.d.ytplayer.config.args.title;
    title = title.replace( /[\\\/\:\*\?\"\|]/g, ''); // \/:*?"|
    this.title = title;

    this.f_next();
  };

  /**
   * @desc Gets the video length in seconds from the ytplayer JS
   * @method
   * @public
   */
  Download.prototype.getLength = function (){
    var length = this.d.ytplayer.config.args.length_seconds || 0;
    this.length = length;

    this.f_next();
  };

  /**
   * @desc Gets the adaptive_fmts (url data) from ytplayer JS
   * @method
   * @public
   */
  Download.prototype.getAdaptiveFmts = function (){
    var args = this.d.ytplayer.config.args,
        adaptive_fmts_str = args.adaptive_fmts
                            || args.url_encoded_fmt_stream_map;

    // Are the fmts scrambled?
    var first_arg_match = /^.+?=.+?&/.exec(adaptive_fmts_str)[0],
        first_args_re = new RegExp(first_arg_match, '');

    adaptive_fmts_str = adaptive_fmts_str.replace(first_args_re, '');
    adaptive_fmts_str = adaptive_fmts_str + ',' + first_arg_match.slice(0, -1);

    // JSON adaptive_fmts_str
    var adaptive_fmts = app.modules.qs.parse(adaptive_fmts_str);

    // Did we succeed?
    if(typeof adaptive_fmts !== 'object')
      return this.f_retryAll('@getAdaptiveFmts: adaptive_fmts no object');

    if(!adaptive_fmts.url)
      return this.f_retryAll('@getAdaptiveFmts: !adaptive_fmts.url');

    if(!adaptive_fmts.type.length || adaptive_fmts.type.length == 0)
      return this.f_retryAll('@getAdaptiveFmts: adaptive_fmts.type incorrect');

    this.d.adaptive_fmts = adaptive_fmts;

    this.f_next();
  };

  /**
   * @desc Finds the best audio download url
   * @method
   * @public
   */
  Download.prototype.getDownloadUrl = function (){
    var adaptive_fmts = this.d.adaptive_fmts,
        type,
        matches = [],
        audio_found = false,
        best_match_i,
        best_url;

    for(var i=0; i<adaptive_fmts.type.length; i+=1){
      type = adaptive_fmts.type[i];

      if(type.indexOf('audio/mp4') !== -1){
        audio_found = true;
        matches.push(i);
      }

      else if(type.indexOf('video/mp4') !== -1) matches.push(i);
    }

    // This part can be used to find the best url
    if(audio_found){
      for(var i=0; i<matches.length; i+=1)
        if(adaptive_fmts.url[matches[i]])
          if(adaptive_fmts.url[matches[i]].indexOf('audio/mp4'))
            best_match_i = matches[i];
        else best_match_i = matches[0];
    }
    else
      best_match_i = matches[0];

    if(!adaptive_fmts.url[best_match_i])
      return this.f_retryAll('@getDownloadUrl: !adaptive_fmts.url[best_match_i]');

    best_url = adaptive_fmts.url[best_match_i];

    if(best_url.indexOf(',') !== -1)
      return this.f_retryAll('@getDownloadUrl: best_url has , in it. Bad fmts');

    // Add required download url parameters
    if(best_url.indexOf('ratebypass=') === -1)
      best_url = best_url+'&ratebypass=yes';
    if(best_url.indexOf('mime=') === -1)
      best_url = best_url+'&mime=audio%2Fmp4';

    this.best_url = best_url;
    this.best_match_i = best_match_i;

    this.f_next();
  };

  /**
   * @desc If the dl_url has a ciphered signature we decipher it by
   * starting the decipherer f_ task list
   * @method
   * @public
   */
  Download.prototype.fixSignature = function (){
    var self = this,
        best_url = this.best_url,
        best_match_i = this.best_match_i,
        adaptive_fmts = this.d.adaptive_fmts;

    if(best_url.indexOf('signature=') !== -1){
      log('\'' + this.v + '\' has got a signature.');

      this.dl_url = best_url;

      this.f_next();
    }
    else {
      logWarn('\'' + this.v + '\' has got no signature.');

      if(!adaptive_fmts.s)
        return this.f_retryAll('@fixSignature: !adaptive_fmts.s');
      if(!adaptive_fmts.s[best_match_i])
        return this.f_retryAll('@fixSignature: !adaptive_fmts.s[best_match_i]');

      if(!this.d.ytplayer.config.assets)
        return this.f_retryAll('@fixSignature: !ytplayer.config.assets');
      if(!this.d.ytplayer.config.assets.js)
        return this.f_retryAll('@fixSignature: !ytplayer.config.assets.js');


      this.ciphered_sig = adaptive_fmts.s[best_match_i];
      this.html5player_url = 'https:' + this.d.ytplayer.config.assets.js;

      
      // Initialize the decipherer with a f_desc containing this.v
      var decipherer = app.modules.f_.setup( new Decipherer({
        dl: this,
        f_desc: 'download:' + this.v + ' -> decipherer'
      }) );


      decipherer.onAbort = function (){
        self.f_retryAll('@fixSignature: decipherer.onAbort called');
      };

      decipherer.onFinish = function (){
        self.f_next();
      };

      decipherer.start();

    }
  };


  /**
   * Set Download.prototype f_ data, this is done from Download.js so we dont
   * clutter the index.js file
   */
  Download = app.modules.f_.augment(Download, {
    function_flow: [
      'getSource',
      'findYtPlayer',
      'evalYtPlayer',
      'getTitle',
      'getLength',
      'getAdaptiveFmts',
      'getDownloadUrl',
      'fixSignature'
    ],
    error_array: 'errs',
    data_namespace: 'd',
    desc: 'download',
    to_log: (use_log ? ['all'] : ['silent'])
  });

  return Download;

};

