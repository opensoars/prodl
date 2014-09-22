f_
==

Asynchronous operations made easy.

## Dependencies
* opensoars_cls
* ezlog

## Code example
```js
var f_ = require('f_');


var Download = function (o){
	o = o || {};

	for(var key in o) this[key] = o[key];

	// required for f_ feedback of err stack
	this.errs = [];
};

Download.prototype.start = function (){
	if(!this.url) this.errs.push('no url given');
	// ... More validating could be done here

	if(this.errs.length !== 0)
		return this.f_abort('err(s) @start, no reason to retry');

	this.next();
};

Download.prototype.getData = function (){
	var self = this;

	http.get(url, function (res){
		var data='';res.on('data', function(c){ data+=c; });

		res.on('end', function (){
			if(data.length < 5000)
				return self.retry('data.length < 5000');

			self.d.data = data;

			return self.next();
		});

	}).on('error', function (){
		return self.retry('http.get error');
	});
};

Download.prototype.convertFile = function (){
	// ... More async operations
};

Download.prototype.clean = function (){
	// ... And more async operations,
	//     to finish just do:

	this.next();
};

/**
 * Two required arrays for f_ to work
 */
Download.prototype.functionFlow =  [
	'getData',
	'convertFile',
	'clean'
];

Download.prototype.toReset = [ 
	{ d: {} },
	{ defaultVideoId: 'NnTg4vzli5s' } 
];


/** Augmenting Download prototype object */
Download = f_.augment(Download);


/** Now let's initiate the download(s) */
for(var i = 0; i < 100; i += 1){
	var downloadInstance = new Download({ url: 'http://someurl.com/file' + i });
	downloadInstance.start();
}

```