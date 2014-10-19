/** Dependencies */
var http = require('http'),
		fs = require('fs'),
		qs = require('querystring'),
		spawn = require('child_process').spawn;

var cls = require('opensoars_cls'),
		DUMP = require('DUMP');


var Ezlog = require('ezlog'),

		log = new Ezlog({
			pref: { t: '[Dl]', c: 'green', s: 'bold' }
		}),

		logProcess = new Ezlog({
			pref: { t: '[child process]', c: 'blue' }
		});


/**
 * Download.prototype function, lotta code so gotta include it. No real
 * differences. Just using normal `Download` scope w/ next(), etc..
 */
var extractData = require('./extractData.js');


/** Download class, initiated at downloader.handler in server.js
 *
 * @arg     o     Options object argument
 * @default errs  Error stack to display in console and 'front-end'
 * @default d     Async function shared data ex: yt src, player code
 */
var Download = function Download (o){

	o = o || {}; for(var key in o) this[key] = o[key];

	this.errs = [];
	this.d = {};

	this.next_maxTries = process.DownloadMaxRetries || 15;

	this.displayName = 'Dl';

	this.dlFolder = process.DLFOLDER;
	this.tempFolder = process.TEMPFOLDER

	return this;
};


/** Starts up a Download, checks necassary data,
 * makes use of the f_abort func and errs stack array
 *
 * @req v {string}  yt video id from HTTP request
 */
Download.prototype.start = function (){

	this.startTime = new Date().getTime();

	if(!this.v) this.errs.push('@start - !this.v');
	else if(typeof this.v !== 'string')
		this.errs.push('@start - typeof this.v !== string');

	if(this.errs.length !== 0)
		return this.f_abort('errors @start');

	log('start: ' + this.v);

	this.socketEmit('dlStart', {});

	this.next();

	return this;
};


/** GETS yt src code with given video id
 * Async http GET request. next() on.end | on.error
 *
 * @d.src {string}  yt src code
 */
Download.prototype.getSource = function (){
	var self = this;

	var url = 'http://www.youtube.com/watch?v=' + this.v;

	http.get(url, function (res){
		var src='';res.on('data',function(c){src+=c});

		res.on('end', function (){
			if(src.length < 5000)
				return self.retry('src.length < 5000');
				

			self.d.src = src;

			return self.next();
		});

	}).on('error', function (){
		return self.retry('http.get error');
	});
};


/** Extracts the ytplayer js code from yt src code
 *
 * @d.code {string}  ytplayer js code
 * @codeMatch {regex} 
 *   <script>var ytplayer  Start with script tag and var ytplayer
 *   .                     After that, any character
 *   +                     ^ one or more times
 *   <\/script>            till we find closing script
 */
Download.prototype.getCode = function (){

	var codeMatch = /<script>var ytplayer.+<\/script>/.exec(this.d.src),
			code = '';

	if(codeMatch.length)
		code = codeMatch[0];
	else
		return this.retry('Regex: !codeMatch.length');

	code = code.replace(/<script>/, '');
	code = code.replace(/<\/script>/, '');

	if(code.length < 5000)
		return this.retry('code.length < 5000');

	this.d.code = code;

	return this.next();
};


/** CAREFUL, DAMN UNORTHODOX... eventualy eval will be removed...
 *
 * Eval js code in order to dive into the ytplayer JSON easily.
 * Requires the document.innerHTML polyfill below, cuz of some init
 * ----------------------------------------------------------------
 */var document={getElementById:function(){return{innerHTML:''};}};/*
 * ----------------------------------------------------------------
 * Creates a new function scope in which the code is evalled
 * @d.ytplayer {string}
 */
Download.prototype.evalCode = function (){
	var self = this;

	(function (self){
		eval(self.d.code);

		if(!ytplayer)
			return self.retry('eval(code) !ytplayer');
		if(typeof ytplayer !== 'object')
			return self.retry('ytplayer !object')

		self.d.ytplayer = ytplayer;

		return self.next();
	}(self));
};


/** Extract data from ytplayer json, save vars and edit data
 * This function also checks for a signature in the url from fmts
 * if it's not present, we have to use the decipher function from
 * html5player.js file from yt source page
 *
 * Calls another f_ 'Class' Decipherer, which takes care of ciphered
 * sigs, if necessary.
 *
 * @d.title {string}  video title, make fs safe name
 * @d.dlUrl {string}  working download url
 */
Download.prototype.extractData = extractData;



/** HTTP file download, stream and move to final loc
 * GET from dlUrl
 * Stream to temp folder
 */
Download.prototype.downloadFile = function (){
	var self = this,
			title = self.d.title;

	var tempLocMp4 = self.tempFolder + title + '.m4a',
			tempLocMp3 = self.tempFolder + title + '.mp3';

	this.d.tempLocMp4 = tempLocMp4;
	this.d.tempLocMp3 = tempLocMp3;

	http.get(this.d.dlUrl, function (res){

		self.d.clen = res.headers['content-length'] || 0;

		var stream = fs.createWriteStream(tempLocMp4);

		stream.on('error', function (err){
			log('stream error', err);
			return self.retry('stream error', err);
		});

		var received = 0;
		res.on('data', function (c){
			received += c.length;
		});

		var dlProgressInterval = setInterval(function (){

			self.socketEmit('dlProgress', { clen: self.d.clen, received: received });

			if(process.LOGPROGRESS){
				var percentageDone = (received / (self.d.clen / 100));

				console.log(
					cls({ t: '[Dl@downloadFile] ', c: 'blue', s: 'bold'})
					+ self.v + ': ' + cls({ t: Math.round(percentageDone),
						c: 'green', s: 'bold' }) + '%'
				);

			}
		}, 500);

		res.on('end', function (){
			clearInterval(dlProgressInterval);
		});

		res.pipe(stream);
		log('Streaming data into: ' + tempLocMp4);

		res.on('end', function (){
			console.log(
				cls({ t: '[Dl@downloadFile] ', c: 'blue', s: 'bold'})
				+ self.v + ': ' + cls({ t: 100, c: 'green', s: 'bold' }) + '%'
			);
			return self.next();
		});
	});
};



/** convertFile: Converts file from mp4(m4a) to mp3 in the temp folder
 * Spawn child process to host command line task in
 *   if inactive for more than 3500 sec
 * ffmpeg pretty much only uses stderr, so we listen for stuff there
 *
 * Has 2 simple helper functions to calculate progress, same as front-end.
 * hoursToSeconds, getPercentage
 */


/** convertFile helper
 * @arg hours {string}  00:00:00.00 notation used
 * @return    {number}  total seconds
 */
function hoursToSeconds(hours){
	var returnRounded = false,
			hs = hours.split(':'),
			h = hs[0], m = hs[1], s = hs[2],
			c = { h: Math.round(h), m: Math.round(m), s: parseInt(s) };
	for(var i=0; i<c.h; i+=1) c.m = c.m + 60;
	for(var i=0; i<c.m; i+=1) c.s = c.s + 60;
	return returnRounded ? Math.round(c.s) : c.s;
}

/** convertFile helper
 * @arg cl {string}  command line progress
 * @arg ln {number}  total length
 * @return {number}  percentage done
 */
function getPercentage(cl, ln){
	if(cl.length < 20) return false;

	var ffmpegClCaptures, avconvClCaptures;

	ffmpegClCaptures = /size\=.+?(\d+?)kB.+?time=(\d+?:\d+?:\d+?\.\d+?) /g
		.exec(cl);

	// If it fails with ffmpeg format, use avconv format
	if(!ffmpegClCaptures)
		avconvClCaptures = /size\=.+?(\d+?)kB.+?time=(.+?) /g
			.exec(cl);

	if(!ffmpegClCaptures && !avconvClCaptures)
		return 0;

	return (
		ffmpegClCaptures === null
		? (parseInt(avconvClCaptures[2])) / (ln / 100)
		: (hoursToSeconds(ffmpegClCaptures[2])) / (ln / 100)
	);

}


Download.prototype.convertFile = function (){

	var logProgress = require('ezlog')({
		pref: { t: '[Dl@convertFile]', c: 'blue', s: 'bold' } 
	});

	var self = this;

	var cp = spawn(process.OS.indexOf('win') !== -1  ? 'ffmpeg' : 'avconv', [
		'-i',
		self.d.tempLocMp4,
		'-acodec',
		'libmp3lame',
		'-ab',
		process.BITRATE,
		self.d.tempLocMp3
	]);

	cp.logAll        = process.CPLOGALL || false;
	cp.maxInactive   = 3500;
	cp.checkInterval = 2000;

	cp.run = function (m){ cp.stdin.write(m + '\n'); };
	//  ^^^ could be added to 'a' cp.prototype?


	logProcess('Spawning process for mp4(m4a) -> mp3 conversion');

	var lastActive = 0;
	function pingActive(){ lastActive = new Date().getTime(); }

	var activePinger = setInterval(function (){
		if(new Date().getTime() - lastActive > cp.maxInactive){
			end('@cp->activePinger  timeSilent > cp.maxInactive '
				+ cp.maxInactive);
			log('@cp->activePinger  Inactive child process!');
		}
	}, cp.checkInterval);

	function retry(m){
		cp.stdin.end();
		clearInterval(activePinger);
		return self.retry(m);
	}

	function end(){

		if(process.LOGPROGRESS) process.stdout.write('\n');

		logProgress(
			self.v + ': ' + cls({ t: 100, c: 'green', s: 'bold' }) + '%'
		);

		logProcess('Closing process....');
		cp.stdin.end();
		clearInterval(activePinger);
		return self.next();
	}

	//cp.stdout.on('data', function (d){}); // Unused with libav?

	cp.stderr.on('data', function (d){

		pingActive();

		var cl = d.toString(); // command 'line'

		if(cl.indexOf('Overwrite ?') !== -1
		|| cl.indexOf('? [y/N]') !== -1)
			cp.run('y');
		
		else if(cl.indexOf('video:') !== -1 
		|| cl.indexOf('muxing overhead') !== -1
		|| cl.indexOf('global headers') !== -1)
			end();
		
		else if(cl.indexOf('size=') !== -1
		&& cl.indexOf('time=') !== -1){
			
			var percentageDone = getPercentage(cl, self.d.length_seconds);

			if(cp.logAll) logProcess(cl);
			if(process.LOGPROGRESS)
				logProgress(
					self.v + ': ' + cls({ t: Math.round(percentageDone),
					c: 'green', s: 'bold' }) + '%'
				);
			
			self.socketEmit('conversionProgress', { percentage: percentageDone });
		}
		
		else if(cl.indexOf('Permission denied') !== -1)
			return retry('cp.stderr, Permission denied');
		
		else if(cl.indexOf('Invalid data found when processing input') !== -1)
			return retry('cp.stderr, Invalid data found when processing input'
				+ '  Probably due to a downloaded file with no data!');

		else if(cl.indexOf('Output file #0 does not contain any stream') !== -1)
			return retry('cp.stderr,' 
				+ 'Output file #0 does not contain any stream');

		// Useless ffmpeg crap
		else{ if(cp.logAll) logProcess(cl); }
			
		
	});

	cp.on('error', function (err){
		cp.stdin.end();
		return retry('cp.on error, fatal cp error occured.');
	});
	
	cp.on('close', function (){
		logProcess('Process closed Succesfuly');
	});

	// If dlFolder is in D drive, go there
	if(this.dlFolder.indexOf('D:/') !== -1) cp.run('D:');
	cp.run('cd ' + this.dlFolder);

};

/** Move the mp3 file from tempFolder to dlFolder
 * Could not use fs.rename cuz of different drives
 * Read content from mp3 file
 * Write content in new mp3 file
 */
Download.prototype.moveFile = function (){
	var self = this;

	self.d.finalLocMp3 = self.dlFolder + '/' + self.d.title + '.mp3';

	fs.readFile(self.d.tempLocMp3, function (err, data){
		if(err)
			return self.retry('fs.readFile(self.d.tempLocMp3) error');

		fs.writeFile(self.d.finalLocMp3, data, function (err){
			if(err)
				return self.retry('fs.writeFile(self.d.finalLocMp3) error');
			self.next();
		});

	});

};

/**
 *
 */
Download.prototype.checkFileSize = function (){

	var self = this;

  fs.stat(self.d.finalLocMp3, function (err, stats) {
  	if(err) return self.retry(err);

  	if(stats.size < 100)
  		return self.retry('fs.stat().size < 100');

  	self.next();
  });

};


/** Delete the mp4 and mp3 from temp folder
 * This uses async fs.unlink, no waiting for completion
 */
Download.prototype.cleanUp = function (){
	var self = this,
			tempLocMp4 = self.d.tempLocMp4,
			logInfo = false;

	fs.unlink(self.d.tempLocMp4, function (err){
		if(err)
			return log('Could not delete: ' + self.d.tempLocMp4)
		if(logInfo) log('Succesfuly deleted: ' + self.d.tempLocMp4);
	});

	fs.unlink(self.d.tempLocMp3, function (err){
		if(err)
			return log('Could not delete: ' + self.d.tempLocMp3)
		if(logInfo) log('Succesfuly deleted: ' + self.d.tempLocMp3);
	});

	return self.next();
};


/** f_ specific
 * @functionFlow  Array of function name strings
 * @toReset       Key value objects to clear mem on retry
 */
Download.prototype.functionFlow = ['getSource', 'getCode', 'evalCode',
	'extractData', 'downloadFile', 'convertFile', 'moveFile', 'checkFileSize', 'cleanUp'];

Download.prototype.toReset = [ { d: {} } ];

Download.prototype.socketEmit = function (evt, d){
	if(process.IDSOCKETS[this.v]){

		for(var i=0; i<process.IDSOCKETS[this.v].length; i+=1){
			process.IDSOCKETS[this.v][i].sendJSON({ type: evt, d: d || {} });
		}
	}
};

/** Removes a video id string from the DOWNLOADS array
 */
Download.prototype.qClear = function (){
	var index = process.DOWNLOADS.indexOf(this.v);
	process.DOWNLOADS.splice(index, 1);
};

/** Events from f_ */

Download.prototype.onAbort = function (errArg){
	this.qClear();

	log('onAbort ' + errArg, 'errs stack:', this.errs);


	// Find out if permission is being denied
	for(var i=0, deniedCount=0; i<this.errs.length; i+=1)
		if(this.errs[i].indexOf('Permission denied') !== -1) deniedCount += 1;
	if(deniedCount >= 2) log('- - !! Probably the file is in use !!  - -');


	this.socketEmit('dlAbort', {
		v: this.v
	});

};

/** onFinish event called from f_
 * qClear()
 * log fancy
 */
Download.prototype.onFinish = function (){
	var self = this;

	self.qClear();

	var timeTaken = new Date().getTime() - self.startTime;

	log('  Finished completely:' + ' \n\n     ' 
		+ ' video id: ' + self.v + '\n     '
		+ '    title: '
			+ (self.d.unsafeTitle || self.d.title) + '\n     '
		+ ' saved as: ' + self.d.title + '.mp3' + '\n     '
		+ '       in: ' + timeTaken + ' ms'
		+ '\n'
	);

	if(self.d.unsafeTitle) 
		log('Ugly filname, might want to change it?!');



	self.socketEmit('dlFinish', {
		v: self.v,
		timeTaken: timeTaken
	});

};

Download.prototype.onNext = function (o){
	var self = this;

	o = o || {};

	fn = o.fn || '';

	if(process.LOGNEXT && o && o.fn)
		log("'next' f_ task: " + o.fn);


	this.socketEmit('dlNext',{
		v: self.v,
		fn: fn,
		next_i: self.next_i,
		fnCount: self.functionFlow.length
	});

};

Download.prototype.onRetry = function (){
	var self = this;

	this.socketEmit('dlRetry', {
		V: self.v,
		fnCount: self.functionFlow.length,
		fn: self.functionFlow[0]
	});
};


/** Make Download Class public */
module.exports = Download;


