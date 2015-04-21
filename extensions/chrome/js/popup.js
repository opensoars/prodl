/**
 *
 * Globals
 *
 */
var HTTP_URL = 'http://localhost:' + PORTS.http + '/api',
    SOCKET_URL = 'ws://localhost:' + PORTS.ws + '/api',
    HAS_INITIALIZED = false;


/**
 *
 * UI
 *
 */
var INPUT = document.getElementById('input'),
    OUTPUT = document.getElementById('output');

INPUT.focus();

var ui = {

  elems: {
    INPUT: INPUT,
    OUTPUT: OUTPUT
  },

  /**
   * @param color {string}  ui type
   * @param text  {string}  text for OUTPUT
   */
  add: function (color, text){
    color = color || '';
    text = text || '';

    var elems = elems = this.elems;

    elems.INPUT.style.color = color;

    if(text.length !== 0) 
      elems.OUTPUT.innerHTML = "<div class='outputLine' style='background: " +
        color + ";'>" + text + '</div>' + elems.OUTPUT.innerHTML;
  }
};


/**
 *
 * Helpers
 *
 */
function getVideoId(url){
  var video_id = '';
  try{
    var q = url.split('/watch?')[1], qs = q.split('&');
    for(var i=0; i<qs.length; i+=1){
      var single_q = qs[i];
      if(single_q.indexOf('v=') !== -1 && single_q.charAt(0) === 'v')
        video_id = single_q.split('v=')[1];
    }
  }
  catch(e){ video_id = ''; }
  return video_id.length === 11 ? video_id : '';
}

function pingServer(cb){
  new Ajax({
    url: HTTP_URL + '/ping',
    timeout: 2500
  }).done(function (){
    cb();
  }).fail(function (){
    cb('pingServer AJAX request failed');
  });
}

function handleInput(){
  ui.add('orange', 'Checking input for video id...');

  var val = INPUT.value,
      video_id = INPUT.value.length === 11
        ? INPUT.value : getVideoId(INPUT.value);

  if(video_id){
    ui.add('green', 'Video id found: ' + video_id);
    INPUT.value = '';

    requestDownload(video_id, function (err){
      if(!err) initSocket(video_id);
    });
  }
  else ui.add('red', 'No video id could be found in input field.');
}

function requestDownload(video_id, cb){

  ui.add('orange', 'Sending download request for video id: ' + video_id + ' ...');

  new Ajax({
    url: HTTP_URL + '/downloads?v=' + video_id,
    method: 'POST',
    timeout: 2500
  }).done(function (res){
    ui.add('green', 'Download request success for video id: ' + video_id);
    cb();
  }).fail(function (res){
    ui.add('red', 'Download request failed');
    cb('Download request failed');
  });
}

function initSocket(video_id){
  console.log('keke init');
}

/**
 *
 * Initialize
 *
 */

pingServer(function (err){
  if(err || HAS_INITIALIZED){
    ui.add('red', 'Server is down');
    return false;
  }

  ui.add('green', 'Server is up!');
  init();
});

// Gets called when pingServer cb is called without an error
function init(){
  HAS_INITIALIZED = true;

  INPUT.addEventListener('keyup', function (evt){
    if(evt.which === 13 || (evt.which === 86 && evt.ctrlKey) )
      handleInput();
  });
}
