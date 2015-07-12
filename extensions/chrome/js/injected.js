/**
 * Extracts video id from YT urls.
 * @param {string} url - YT url to extract video id from
 * @return {string} video_id - YT video id
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


var btn_container = document.getElementById('yt-masthead-user')
  || document.getElementById('yt-masthead-signin');


var upload_btn = document.getElementById('upload-btn');


var dl_btn = document.createElement('a');
dl_btn.href = '#';
dl_btn.className = 'yt-uix-button yt-uix-button-size-default'
    + ' yt-uix-button-primary';
dl_btn.setAttribute('style', 'margin-right: 15px;');

dl_btn.addEventListener('click', function (evt){
  var v = getVideoId(window.location.href);

  chrome.runtime.sendMessage({ v: v }, function (res){
    console.log(res);
  });


  evt.preventDefault();
  return false;
});

dl_btn_content = document.createElement('span');
dl_btn_content.className = 'yt-uix-button-content';
dl_btn_content.textContent = 'Download';

dl_btn.appendChild(dl_btn_content);

btn_container.insertBefore(dl_btn, upload_btn);



/*
var dl_btn_html = "<a id='dl_btn' href='#' class='yt-uix-button "
  + "yt-uix-button-size-default yt-uix-button-primary'>"
  + "<span class='yt-uix-button-content'>Download</span></a>";

btn_container.innerHTML =
  dl_btn_html + '&nbsp;&nbsp;&nbsp;&nbsp;' + btn_container.innerHTML;*/