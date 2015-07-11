/**
 * @param {object} app - Application namespace.
 * @return {object} Download
 */
module.exports = function (app){
  app = app || {};

  var dump = app.dump,
      https = app.modules.https,
      Decipherer = app.libs.Decipherer,
      log = app.download_log,
      logErr = app.download_logErr,
      logWarn = app.download_logWarn;

  /**
   * Extracts seconds from notation described @ param hours
   * @param {string} hours - 00:00:00.00 notation used
   * @return {number} - total seconds
   * @private
   */
  function hoursToSeconds (hours){
    var round = false,
        hs = hours.split(':'),
        h = hs[0], m = hs[1], s = hs[2],
        c = { h: Math.round(h), m: Math.round(m), s: parseInt(s) };
    for(var i = 0; i < c.h; i += 1) c.m = c.m + 60;
    for(var i = 0; i < c.m; i += 1) c.s = c.s + 60;
    return round ? Math.round(c.s) : c.s;
  }

  /**
   * Extracts percentage done from stderr data
   * @param {string} data - Stderr line data
   * @param  {number} dl_length - Total length of download
   * @return {number} - Percentage done
   * @private
   */
  function getPercentage (data, dl_length){
    if(data.length < 20) return false;

    var ffmpeg_cl_captures, avconv_cl_captures;

    ffmpeg_cl_captures = /size\=.+?(\d+?)kB.+?time=(\d+?:\d+?:\d+?\.\d+?) /g
      .exec(data);

    // If it fails with ffmpeg format, use avconv format
    if(!ffmpeg_cl_captures)
      avconv_cl_captures = /size\=.+?(\d+?)kB.+?time=(.+?) /g.exec(data);

    if(!ffmpeg_cl_captures && !avconv_cl_captures) return 0;

    return (
      ffmpeg_cl_captures
        ? (hoursToSeconds(ffmpeg_cl_captures[2])) / (dl_length / 100)
        : (parseInt(avconv_cl_captures[2])) / (dl_length / 100)
    );
  }


  /**
   * f_ download task list constructor.
   * @param {object} o - Options
   * @constructor
   * @public
   */
  function Download (o){
    o = o || {};
    for(var k in o) this[k] = o[k];

    this.dl_dir = app.params.dl_dir;
    this.temp_dir = app.temp_dir;

    return this;
  }

  /**
   * Starts a download f_ task list if requirements are met.
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

    log('Starting: ' + self.v);

    // Update f_desc with video id
    self.f_desc = self.f_desc + ':' + self.v;

    self.f_next();

    // Allow chain calling?
    //return this;
  };

  /**
   * HTTPS GET youtube video source code.
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
   * Extracts the ytplayer JS script from the youtube source code.
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
  var document = { getElementById: function (){ return { innerHTML: '' }; } },
      window = {};

  /**
   * Evaluate ytplayer JS code in a scope sandbox.
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
   * Gets the video title from the ytplayer JS.
   * @public
   */
  Download.prototype.getTitle = function (){
    var title = this.d.ytplayer.config.args.title;
    title = title.replace( /[\\\/\:\*\?\"\|]/g, ''); // \/:*?"|
    this.title = title;

    this.f_next();
  };

  /**
   * Gets the video length in seconds from the ytplayer JS.
   * @public
   */
  Download.prototype.getLength = function (){
    var length = this.d.ytplayer.config.args.length_seconds || 0;
    this.d.length_seconds = length;

    this.f_next();
  };

  /**
   * Gets the adaptive_fmts (url data) from ytplayer JS.
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
   * Finds the best audio download url.
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

    this.d.best_url = best_url;
    this.d.best_match_i = best_match_i;

    this.f_next();
  };

  /**
   * If the dl_url has a ciphered signature we decipher it by
   * starting the decipherer f_ task list.
   * @public
   */
  Download.prototype.fixSignature = function (){
    var self = this,
        best_url = this.d.best_url,
        best_match_i = this.d.best_match_i,
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
        self.d.deciphered_sig = this.d.deciphered_sig;
        self.f_next();
      };

      decipherer.start();
    }
  };

  /**
   * Complete the download url ith the deciphered signature.
   * @public
   */
  Download.prototype.completeUrl = function (){
    this.d.dl_url = this.d.best_url + '&signature=' + this.d.deciphered_sig;
    this.f_next();
  };

  /**
   * Complete download locations.
   * @public
   */
  Download.prototype.completeDownloadLocs = function (){
    var title = this.title,  
        temp_loc_mp4 = this.temp_dir + title + '.m4a',
        temp_loc_mp3 = this.temp_dir + title + '.mp3';

    this.d.temp_loc_mp4 = temp_loc_mp4;
    this.d.temp_loc_mp3 = temp_loc_mp3;

    this.f_next();
  };

  /**
   * Streams data served at d.dl_url to the temp folder.
   * @public
   */
  Download.prototype.downloadFile = function (){
    var self = this,
        title = self.title,
        dl_url = self.d.dl_url,
        temp_loc_mp4 = this.d.temp_loc_mp4,
        temp_loc_mp3 = this.d.temp_loc_mp3,
        protocol = dl_url.indexOf('https') !== -1 ? 'https' : 'http';
    
    self.d.bytes_received = 0;

    app.modules[protocol].get(dl_url, function (res){
      self.d.content_length = res.headers['content-length'] || 0;

      var stream = app.modules.fs.createWriteStream(temp_loc_mp4);

      stream.on('error', function (err){
        return self.f_retryAll('@downloadFile: stream error', err);
      });

      res.on('data', function (c){ self.d.bytes_received += c.length;   });

      res.pipe(stream);
      log('Streaming data into: ' + temp_loc_mp4);

      res.on('end', function (){
        log('Download complete');

        if(self.d.bytes_received === 0)
          return self.f_retryAll('@downloadFile: 0 bytes received.');

        self.f_next();
      });

    }).on('error', function (err){
      self.f_retryAll('@downloadFile: GET error', err);
    });
  };

  /**
   * Spawns avconv child process which converts the downloaded data from
   * m4a to mp3.
   * @public
   */
  Download.prototype.convertFile = function (){
    var self = this,
        spawn = app.modules.spawn,
        platform = app.modules.os.platform(),
        has_ended = false;

    var cp = spawn(platform.indexOf('win') !== -1  ? 'ffmpeg' : 'avconv', [
      '-i',
      self.d.temp_loc_mp4,
      '-acodec',
      'libmp3lame',
      '-ab',
      app.params.bitrate || '128K',
      self.d.temp_loc_mp3
    ]);

    /**
     * Sends a string to the child process its stdin channels. Adds a newline
     * so the command is run as soon as its send.
     * @param {string} cmd - Command to write to the child process its stdin.
     * @private
     */


    cp.write = function (cmd){
      cp.stdin.write(cmd + '\n');
    };

    /**
     * Singleton which ends the current task.
     * @private
     */
    function end (){
      if(has_ended) return;
      self.f_next();
      has_ended = true;
    }

    /**
     * Handles stderr output.
     * @param {object} data - Binary stderr output.
     * @private
     */
    function dataHandler (data){
      data = data.toString();
        
      if(data.indexOf('video:') !== -1 
      || data.indexOf('muxing overhead') !== -1
      || data.indexOf('global headers') !== -1)
        end();
      else if(data.indexOf('size=') !== -1
      && data.indexOf('time=') !== -1){
        var percentage_done = getPercentage(data, self.d.length_seconds);
        self.percentage_done = percentage_done;

        log(self.v + ' ' + Math.round(percentage_done) + '%');
      }
      else if(data.indexOf('Permission denied') !== -1)
        return self.f_retryAll('cp.stderr, Permission denied', data);
      else if(data.indexOf('Invalid data found when processing input') !== -1)
        return self.f_retryAll('cp.stderr, Invalid data found when processing'
          + ' input. Probably due to a downloaded file with no data', data);
      else if(data.indexOf('Output file #0 does not contain any') !== -1)
        return self.f_retryAll('cp.stderr,' 
          + ' Output file #0 does not contain any stream', data);
      else {
        //log(data.replace(/\n/, ''));
      }
    }

    /**
     * @private
     */
    function errorHandler (err){
      try { cp.stdin.end(); } catch (e) {}
      return self.f_retryAll('@convertFile: cp.on error', err);
    }

    /**
     * @private
     */
    function closeHandler (){
      log('Coversion process closed');
      end();
    }

    /**
     * Bind child process stderr and child process event handlers.
     */
    cp.stderr.on('data', dataHandler);
    cp.on('error', errorHandler);
    cp.on('close', closeHandler);

    /**
     * @todo
     * !!! MAKE THIS WORK FOR OTHER DRIVES !!!
     * @todo
     */
    // If dl_folder is on D drive, cd there
    if(app.params.dl_dir.indexOf('D:/') !== -1) cp.write('D:');
    cp.write('cd ' + app.params.dl_dir);
  };

  /**
   * Moves the downloaded file from the /temp folder to the download director
   * specified in params.json
   * @public
   */
  Download.prototype.moveFile = function (){
    var self = this,
        final_loc_mp3 = self.dl_dir + '/' + self.d.title + '.mp3',
        fs = app.modules.fs;

    self.d.final_loc_mp3 = final_loc_mp3;

    fs.readFile(self.d.temp_loc_mp3, function (err, file_data){
      if(err) return self.f_retryAll('@moveFile: readFile error', err);

      fs.writeFile(final_loc_mp3, file_data, function (err){
        if(err) return self.f_retryAll('@moveFile: writeFile error', err);
        self.f_next();
      });
    });
  };

  /**
   * Checks whether the moved file is actualy present and if it contains enough
   * bytes to be a valid mp3 file.
   * @public
   */
  Download.prototype.checkFile = function (){
    var self = this;

    app.modules.fs.stat(self.d.final_loc_mp3, function (err, stats){
      if(err) return self.f_retryAll('@checkFile: fs.stat error', err);

      if(stats.size < 100)
        return self.f_retryAll('@checkFile: fs.stat().size < 100');

      self.f_next();
    });
  };

  /**
   * Cleans data from the temp folder.
   * @public
   */
  Download.prototype.clean = function (){
    var self = this,
        fs = app.modules.fs,
        temp_loc_mp3 = self.d.temp_loc_mp3,
        temp_loc_mp4 = self.d.temp_loc_mp4;

    fs.unlink(temp_loc_mp3, function (err){
      if(err) return logWarn('@clean: could not delete ' + temp_loc_mp3);
      log('Succesfuly deleted: ' + temp_loc_mp3);
    });

    fs.unlink(temp_loc_mp4, function (err){
      if(err) return logWarn('@clean: could not delete ' + temp_loc_mp4);
      log('Succesfuly deleted: ' + temp_loc_mp4);
    });

    self.f_next();
  };

  /**
   * Set Download.prototype f_ data, this is done from Download.js so we dont
   * clutter the index.js file.
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
      'fixSignature',
      'completeUrl',
      'completeDownloadLocs',
      'clean',
      'downloadFile',
      'convertFile',
      'moveFile',
      'checkFile',
      'clean'
    ],
    error_array: 'errs',
    data_namespace: 'd',
    desc: 'download',
    to_log: (app.params.use_log ? ['all'] : ['silent'])
  });

  return Download;
};

