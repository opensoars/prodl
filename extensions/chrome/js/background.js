var HTTP_URL = 'http://localhost:3332';


/** AJAX helper function
 * @arg url {string}  The url to request to
 * @arg cb  {func}    Called when readyState = 4
 * @return  {bool}    Whether request could be made or not
 */ 
function checkIfUp(url, cb){
  var req = new XMLHttpRequest();

  req.onreadystatechange = function (){
    if(this.readyState === 4)
      if(this.response === 'succes') return cb(true);
      else return cb(false);
  };

  req.open('GET', url, true);
  req.send();
}


/** Function used to request a download.
 * @arg    videoId {string}       YT video id to download
 * @arg    cb      {func}         Called when readyState = 4
 * @return         {null|string}  Null or error string message
 */
function requestDownload(videoId, cb){
  var req = new XMLHttpRequest();

  req.onreadystatechange = function (){
    if(this.readyState === 4 && this.status === 200)
      return cb(null);
    
    else if(this.readyState === 4 && this.status !== 200)
      return cb('status !== 200');
  };

  req.open('GET', HTTP_URL + '/requestDownload?v=' + videoId, true);
  req.send();
}

chrome.runtime.onConnect.addListener(function(port) {

  if(port.name === 'ping')
    port.onMessage.addListener(function() {
      checkIfUp(HTTP_URL + '/ping', function (isUp){
        port.postMessage({isUp: isUp});
      });
    });
  
  else if(port.name === 'requestDownload')
    port.onMessage.addListener(function(msg){
      if(msg.v)
        requestDownload(msg.v, function (err){
          if(err) return port.postMessage({status: 'failed', err: err});
          port.postMessage({status: 'succes'});
        });
    });

});




