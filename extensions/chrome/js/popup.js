var HTTP_URL = 'http://localhost:3332',
    SOCKET_URL = 'ws://localhost:3334',
    VIDEO_ID = '';

var input = document.getElementById('input'),
    output = document.getElementById('output');


function pingServer(cb){
  var req = new XMLHttpRequest();

  var timeoutTimer = setTimeout(function (){
    cb('server not responding');
  }, 2000);

  req.onreadystatechange = function (){
    if(this.readyState === 4 && this.status === 200){
      window.clearTimeout(timeoutTimer);
      cb();
    }
  };
  //req.onabort = cb('ontimeout');

  req.open('GET', HTTP_URL + '/ping', true);
  req.send();
}


function getVideoId(url){
  var videoId = '';
  try{
    var q = url.split('/watch?')[1], qs = q.split('&');
    for(var i=0; i<qs.length; i+=1){
      var singleQ = qs[i];
      if(singleQ.indexOf('v=') !== -1 && singleQ.charAt(0) === 'v')
        videoId = singleQ.split('v=')[1];
    }
  }
  catch(e){ videoId = ''; }
  return videoId.length === 11 ? videoId : undefined;
}


function requestDownload(videoId){

  var req = new XMLHttpRequest();

  req.onreadystatechange = function (){
    if(this.readyState === 4 && this.status === 200){}
      // MAKE BUTTON NOTIFIERS
    else if(this.readyState === 4){}
      // MAKE BUTTON NOTIFIERS
  };

  function onerror(){
    // MAKE BUTTON NOTIFIERS
  }

  req.onabort = onerror;
  req.onerror = onerror;

  req.open('GET', HTTP_URL + '/requestDownload?v=' + videoId, true);
  req.send();
}


function initSocket(){

  console.log('INIT SOCKET');

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
          console.log('TIMEOUT');
          self.stop();
        }
      }, self.checkInterval);
    }
  };

  var ws = new WebSocket(SOCKET_URL);

  ws.sendJSON = function (json){ ws.send(JSON.stringify(json)); };

  ws.onopen = function (){
    pinger.start();
    ws.sendJSON({type: 'setV', v: VIDEO_ID });
  };

  ws.onmessage = function (d){
    var data = d.data;

    if(data.charAt(0) === '{') data = JSON.parse(data);
    else return false;
    if(!data.d) data.d = {};

    var type = data.type;

    if(wsEvents[type]) wsEvents[type](data.d);
  };

  var wsEvents = {

    socketConnection: function (){
      ws.sendJSON({type: 'setV', v: VIDEO_ID });
    },

    dlAbort: function (){
      pinger.ping();
      pinger.stop();

      ui.add('red', 'dlAbort');
      //progSlider.setWidth(0);

      ws.close();
    },

    dlNext: function (d){
      pinger.ping();

      ui.add('orange', d.fn + ': step ' + d.next_i + ' / ' + d.fnCount);
    },

    dlRetry: function (d){
      pinger.ping();

      ui.add('red', 'Retrying download...');
    }


  }
}

/**
 * Little bit more OO theming
 */

var ui = {

  es: {
    input: input,
    output: output
  },

/**
 * @param which {string}  ui type
 * @param text {string}  text for output
 */

  add: function (which, text){
    which = which || '';
    text = text || '';

    var es = es = this.es;

    es.input.style.color = which;

    if(text.length !== 0) 
      es.output.innerHTML = "<div class='outputLine' style='background: " + 
        which + ";'>" + text + '</div>' + es.output.innerHTML;
  }
};

/**
 * @param val {string}  from text input
 * @return {bool}
 */
function hasVideoId(val){
  val = val || '';
  if(val.length === 11) return true;
  else if(getVideoId(val)) return true;
  else return false;
}




var hasInitialized = false;
pingServer(function (err){
  if(err || hasInitialized){
    ui.add('red', 'Server is down!');
    return false;
  }

  init();
});


function init(){

  if(hasInitialized === true) return false;

  input.focus();

  ui.add('green', 'Server is up!');

  input.addEventListener('keyup', function (evt){

    if(evt.which === 13 || (evt.which === 86 && evt.ctrlKey) ){

      if(hasVideoId(input.value)){

        var videoId = input.value.length === 11 
          ? input.value
          : getVideoId(input.value);

        VIDEO_ID = videoId;

        initSocket();
        requestDownload(videoId);

        ui.add('green', "Nice, we've got something to work with!");

      }
      else ui.add('red', "That's not something we can use..");
    
    }

  });

  hasInitialized = true;

}
