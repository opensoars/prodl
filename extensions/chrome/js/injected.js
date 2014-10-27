
// Make sure we've got the least overhead as possible
if(window.location.href.indexOf('youtube.com/watch?') !== -1){

/**
 * HTML/CSS to be injected
 */
var dlBtnHTML = '<button id="dlBtn" class="yt-uix-button'
  + ' yt-uix-button-primary yt-uix-button-size-default">Download</button>';

var sliderHTML = '<div id="progCont"><div id="progSlider"></div></div>';


/**
 * Helper functions
 */

/** Get video id from url given
 * @arg    url     {string}  To get video id from
 * @return videoId {string}  Extracted video id
 */
function getVideoId(url){
  var q = url.split('/watch?')[1], qs = q.split('&');

  for(var i=0, videoId = ''; i<qs.length; i+=1){
    var singleQ = qs[i];
    if(singleQ.indexOf('v=') !== -1 && singleQ.charAt(0) === 'v')
      videoId = singleQ.split('v=')[1];
  }
  return videoId;
}


/** Ping communication between content and background script
 * @expect msg      {object}  Holds server status
 * @prop   msg.isUp {bool}    Whether server is up or not
 * @call   init()             Initialize Prodl inDOM application
 */
var pingPort = chrome.runtime.connect({name: 'ping'});

pingPort.onMessage.addListener(function (msg){
  msg = msg || {};
  if(msg.isUp){
    stopPing = true;
    pingPort.disconnect();
    init();
  }
});


/**
 * Server pinger recursive function
 * @call  pingPort.postMessage(!args);
 */
var pingTimeout = 1000, stopPing = false;

(function runPing(){
  if(stopPing) return false;

  pingPort.postMessage();

  pingTimeout = pingTimeout * 1.3;
  setTimeout(runPing, Math.round(pingTimeout));
}());

setTimeout(function (){ stopPing = true; }, 60000);


/**
 * Globals
 */
var SOCKET_URL = 'ws://localhost:3334',
    VIDEO_ID = getVideoId(window.location.href);

var BTN_CONTAINER = document.getElementById('yt-masthead-signin');

// If user is logged in, container changes ID
if(!BTN_CONTAINER)
  BTN_CONTAINER = document.getElementById('yt-masthead-user');


/** Main Prodl inDOM application
 * 1 Sets up requestDownload content background script communication
 * 2 Augments YT DOM
 * 3 addEventListener to download button(dlBtn)
 * 3 Initializes websockets
 */
function init(){

  var reqDlPort = chrome.runtime.connect({name: 'requestDownload'});

  reqDlPort.onMessage.addListener(function (msg){
    msg.status = msg.status || '';

    if(msg.status === 'succes')
      dlBtn.set({ t: 'Download has started successfuly!' });
    else dlBtn.set({ c: 'red', t: 'Download could not be started, is Prodl running?' });
  });

  BTN_CONTAINER.innerHTML += dlBtnHTML + sliderHTML;

  var dlBtn = document.getElementById('dlBtn');

  dlBtn.set = function (o){
    o = o || {};

    if(o.c){ this.style.background = o.c; this.style.borderColor = o.c; }
    if(o.t){ this.textContent = o.t;  }
  };

  var progCont = document.getElementById('progCont');
  var progSlider = document.getElementById('progSlider');

  progSlider.setWidth = function (w){
    this.style.width = w + '%';
  };

  var pinger = {
    checkInterval: 3000,
    maxInactive: 6000,
    lastActive: new Date().getTime(),

    stop: function (){ clearInterval(this.checkInterval); },
    ping: function (){ this.lastActive = new Date().getTime(); },
    start: function (){
      var self = this;
      self.ping();
      self.checkInterval = setInterval(function (){
        if( (new Date().getTime() - self.lastActive) > self.maxInactive){
          dlBtn.set({ c: '#1b7fcc', t: 'No server response (is Prodl running?). Click to retry.' });
          progSlider.setWidth(0);
          self.stop();
        }
      }, self.checkInterval);
    }
  };


  dlBtn.addEventListener('click', function (){
    dlBtn.set({ c: 'orange', t: '. . .' });

    reqDlPort.postMessage({ v: VIDEO_ID || getVideoId(window.location.href)} );
    pinger.start();
  }, true);

  dlBtn.addEventListener('focus', function (){
    setTimeout(function (){ dlBtn.blur(); }, 333);
  });


  var ws = new WebSocket(SOCKET_URL);

  ws.sendJSON = function (json){ ws.send(JSON.stringify(json)); };

  ws.onopen = function (){
    ws.sendJSON({type: 'setV', v: VIDEO_ID });
  };

  ws.onmessage = function (d){
    var data = d.data;

    if(data.charAt(0) === '{') data = JSON.parse(data);
    else return false;
    if(!data.d) data.d = {};

    var type = data.type;

    if(wsEvents[type] && typeof wsEvents[type] === 'function')
      wsEvents[type](data.d);
  };

  var wsEvents = {

    socketConnection: function (){
      ws.sendJSON({type: 'setV', v: VIDEO_ID });
    },

    dlNext: function (d){
      pinger.ping();
      dlBtn.set({ t: d.fn + ': step ' + d.next_i + ' / ' + d.fnCount });
      progSlider.setWidth(0);
    },

    dlAbort: function (){
      pinger.ping();
      pinger.stop();

      dlBtn.set({c: 'red', t: '@' + dlBtn.textContent.split(':')[0] + ' aborted!'});
      progSlider.setWidth(0);

      setTimeout(function (){
        dlBtn.set({c: '#1b7fcc', t: 'Try again?'});
        progSlider.setWidth(0);
      }, 3000);

    },

    dlRetry: function (d){
      pinger.ping();
      dlBtn.set({t: d.fn + ': step ' + '0' + ' / ' + d.fnCount});
      progSlider.setWidth(0);
    },

    dlStart: function (){
      pinger.ping();
    },

    dlFinish: function (d){
      pinger.ping();
      pinger.stop();

      setTimeout(function (){
        dlBtn.set({c: 'green', t: 'Download complete in: ' + d.timeTaken + ' ms'});
        progSlider.setWidth(0);
      }, 500);
    },

    conversionProgress: function (d){
      pinger.ping();

      var percentageDone = 0;
      try{ percentageDone = parseInt(d.percentage); }
      catch(e){ console.log(e); }

      progSlider.setWidth(percentageDone);
    },

    dlProgress: function (d){
      pinger.ping();
      progSlider.setWidth( (d.received / (d.clen / 100)) );
    },

    deciphererRetry: function (){
      pinger.ping();
    }
  };
} // /init


} // /window.location.href.indexOf('youtube.com/watch?') !== -1