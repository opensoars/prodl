var qs = require('querystring'),  
    fs = require('fs');

var f_ = require('f_');
var Decipherer = require('../../Decipherer');

Decipherer = f_.augment(Decipherer, 'Decipherer', 'Dcphr');

var Ezlog = require('ezlog'),
    log = new Ezlog({ pref: {t:'[Dl]', c:'green', s:'bold'} });

var DUMP = require('DUMP');

/** 
 * We won't add 'extractData' to low flow
 */
var extractData = function (){

  var self = this;

  var args = self.d.ytplayer.config.args;

  /**
   * Length in seconds for estimating time left
   */
  self.d.length_seconds = args.length_seconds || 0;

  /**
   * Make the title safe for fs and ffmpeg
   */
  var title = args.title;
  title = title.replace(/[\"\\\/\[\]\(\)\|\{\}\<\>]/g, ''); // \/[]()|

  var unsafeTest = /[^\x00-\x7F]/g.test(title);

  if(unsafeTest){
    self.d.unsafeTitle = title;
    title = self.v + '_' + title.replace(/[^\x00-\x7F]/g, "");
  }

  self.d.title = title;


  var adaptive_fmtsSTR = args.adaptive_fmts || args.url_encoded_fmt_stream_map;

  /**
   * Fix first arg as last arg, make adaptive_fmts JSON
   * Check if everything is set correctly
   */
  var firstArgMatch = /^.+?=.+?&/.exec(adaptive_fmtsSTR)[0];
  var firstArgRegexp = new RegExp(firstArgMatch, '');

  adaptive_fmtsSTR = adaptive_fmtsSTR.replace(firstArgRegexp, '');
  adaptive_fmtsSTR = adaptive_fmtsSTR + ',' + firstArgMatch.slice(0, -1);

  var adaptive_fmts = qs.parse(adaptive_fmtsSTR);
  if(typeof adaptive_fmts !== 'object')
    return self.retry('adaptive_fmts no object');

  if(!adaptive_fmts.url) return self.retry('!adaptive_fmts.url');

  if(!adaptive_fmts.type.length || adaptive_fmts.type.length == 0)
    return self.retry('adaptive_fmts.type incorrect');

  /**
   * Find best mp4 by looping through 'type'
   * The incrementer: i will be used to get more data
   *  from all linear arrays
   */

  var type, matches = [],
      audioFound = false, audioIndex;

  for(var i=0; i<adaptive_fmts.type.length; i+=1){
    type = adaptive_fmts.type[i];

    if(type.indexOf('audio/mp4') !== -1){
      audioFound = true;
      matches.push(i);
    }

    else if(type.indexOf('video/mp4') !== -1) matches.push(i);
  }

  var bestMatchI;

  /********************* BEST COULD BE FOUND HERE *********************/

  if(audioFound){
    for(var i=0; i<matches.length; i+=1)
      if(adaptive_fmts.url[matches[i]].indexOf('audio/mp4'))
        bestMatchI = matches[i];
  }
  else
    bestMatchI = matches[0] // NOW WE USE THE FIRST IN LINE


  if(!adaptive_fmts.url[bestMatchI])
    return self.retry('!adaptive_fmts.url[bestMatchI]');

  var bestUrl = adaptive_fmts.url[bestMatchI];


  if(bestUrl.indexOf(',') !== -1)
    return self.retry('bestUrl has , in it. Bad fmts');


  /** Add some required dlUrl params */
  if(bestUrl.indexOf('ratebypass=')=== -1) bestUrl = bestUrl+'&ratebypass=yes';
  if(bestUrl.indexOf('mime=')=== -1) bestUrl = bestUrl+'&mime=audio%2Fmp4';


  /********************* SIGNATURE *********************/


  /** If signature is already in URL */
  if(bestUrl.indexOf('signature=') !== -1){

    log('Got a video `WITH` signature');

    self.d.dlUrl = bestUrl;
    return self.next();
  }
  /** If signature is NOT already in URL
   * Check for requirements
   * adaptive_fmts.s  Signatures
   * ytplayer assets  css, js, etc file locations
   */
  else {

    log('Got a video `WITHOUT` signature');

    if(!adaptive_fmts.s)
      return self.retry('!adaptive_fmts.s');
    if(!adaptive_fmts.s[bestMatchI])
      return self.retry('!adaptive_fmts.s[bestMatchI]');
    if(!self.d.ytplayer.config.assets)
      return self.retry('!self.d.ytplayer.config.assets');
    if(!self.d.ytplayer.config.assets.js)
      return self.retry('!self.d.ytplayer.config.assets.js');

    var html5playerUrl = 'http:' + self.d.ytplayer.config.assets.js,
        cipheredSig = adaptive_fmts.s[bestMatchI];

    self.d.dlUrl = bestUrl;
    self.d.html5playerUrl = html5playerUrl;
    self.d.cipheredSig = cipheredSig;


    var decipherer = new Decipherer({
      dl: self
    }).start();

  }

};


module.exports = extractData;

