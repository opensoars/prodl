function Ajax(t){function e(t){if(r!==!1)throw"`has_completed === true`. Already called done or fail";r=!0,i.doneCb&&i.doneCb(t,n)}function s(t){if(r!==!1)throw"`has_completed === true`. Already called done or fail";r=!0,i.failCb&&i.failCb(t,n)}function a(){s({desc:"Request timed out after: "+n.timeout+" ms",status:this.status})}function o(){4===this.readyState&&0!==this.status&&(200===this.status||304===this.status?(/application\/json/.test(this.getAllResponseHeaders())&&(this.response=JSON.parse(this.response)),e(this.response)):s({desc:"HTTP status code was neiter a 200 nor 304",status:this.status,res:this.response}))}var i=this;if(t=t||{},!t.url)throw"Ajax needs a url to make the request to";t.method=t.method||"GET",t.data=t.data||"",t.timeout=t.timeout||5e3,this.doneCb=void 0,this.failCb=void 0;var n=new XMLHttpRequest,r=!1;if(n.onreadystatechange=o,n.ontimeout=a,n.open(t.method,t.url,!0),n.timeout=t.timeout,"function"==typeof t.data)throw"Ajax cannot send a function";return"object"==typeof t.data&&(t.data=JSON.stringify(t.data)),n.send(t.data),this}Ajax.prototype.done=function(t){return this.doneCb=t,this},Ajax.prototype.fail=function(t){return this.failCb=t,this};