chrome.runtime.onMessage.addListener(function (req, sender, sendRes){

  var http_req = new XMLHttpRequest();

  http_req.open('POST', 'http://localhost:3333/api/downloads/' + req.v);

  http_req.onreadystatechange = function (){
    if(this.readyState === 4){
      console.log('req done');
    }
  }

  http_req.send();

});