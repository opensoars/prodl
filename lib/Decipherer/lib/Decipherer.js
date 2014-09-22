var Ezlog = require('ezlog'),
		log = new Ezlog({
			pref: { t: '[Dl->Dcphr]', c:'green', s:'bold' }
		});


var cls = require('opensoars_cls'),
		DUMP = require('DUMP');


var http = require('http');

var swapSolutions = require('./swapSolutions');

/** 
 * We can count on the Class requirements being met cuz of
 * checking in extractData.js
 */
var Decipherer = function Decipherer(o){
	o = o || {};

	this.next_maxTries = 4;

	this.errs = [];
	this.d = {};
	this.dl = o.dl;

	return this;
};


Decipherer.prototype.functionFlow = ['gethtml5player', 'getDecipherFn',
	'getDecipherFunc', 'fixSwapper', 'completeUrl'];
Decipherer.prototype.toReset = [{d: {}}];

Decipherer.prototype.start = function (){

	this.next();
};

Decipherer.prototype.gethtml5player = function (){
	var self = this,
			dl = self.dl;

	http.get(dl.d.html5playerUrl, function (res){
		var b='';res.on('data',function(c){b+=c;});

		res.on('end', function (){
			if(b.length < 5000)
				return self.retry('http.get(html5player) b.length < 5000');

			dl.d.html5player = b;

			return self.next();
		});

	}).on('error', function (err){
		return self.retry('http.get(html5playerUrl) error');
	});


};
/****************************************************
*/////////////////////////////////////////////////////
Decipherer.prototype.getDecipherFn = function (){
	var self = this,
			html5player = self.dl.d.html5player;

	var decipherCall = 
		/if\(.+\..+?\|\|.\..+?\){var .+?=.+?.sig\|\|.+?\(.+?\..+?\)/
		.exec(html5player);

	if(!decipherCall.length)
		return self.retry('!decipherCall.length');
	if(decipherCall[0].length < 10)
		return self.retry('decipherCall[0].length < 10');

	decipherCall = decipherCall[0];
	self.d.decipherCall = decipherCall;

	var fn = /if\(.+\..+?\|\|.\..+?\){var .+?=.+?.sig\|\|(.+?)\(.+?\..+?\)/
		.exec(decipherCall)[1];

	if(fn.charAt(0) === '$') fn = '\\' + fn;
	
	self.d.decipherFn = fn;

	return self.next();
};

Decipherer.prototype.getDecipherFunc = function (){
	var self = this,
			dl = self.dl,
			html5player = dl.d.html5player;

	var decipherMatchStr = new RegExp("function " 
		+ self.d.decipherFn + "\(.+?\)\{.+?return.+?\}", 'g');
	var decipherMatch = decipherMatchStr.exec(html5player);

	if(!decipherMatch.length || decipherMatch.length === 0)
		return self.retry('!decipherMatch.length');

	var decipherStr = decipherMatch[0],
			decipherBody = /.+?\{(.+?)\}/.exec(decipherStr)[1];

	self.d.decipherStr = decipherStr;
	self.d.decipherBody = decipherBody;

	self.next();
};


function getObjFromCode(obj, code){
	obj = obj || ''; code = code || '';

	var matchesStr = new RegExp(obj + '=\{.+?\};'),
			matches = matchesStr.exec(code);

	if(!matches || !matches.length) return undefined;
	return matches[0];
}

Decipherer.prototype.fixSwapper = function (){

	var self = this,
			dl = self.dl,
			decipherBody = self.d.decipherBody,
			html5player = dl.d.html5player,
			decipherBodyfirstCharAsArg = decipherBody.charAt(0); // get @top!!


	/** Simple testing to see which solution we're going to use */

	// ;ze.cd(a,5);  Note everything is between semicolons ;...;
	var hasArrManipObj = /\;.{1,3}\..{1,3}\(.{1,3}\,.{1,3}\)\;/g
		.test(decipherBody);

	// a=ze.cd(a,5)
	var hasVarDecSwapObj = /.{1,3}=.{1,3}\..{1,3}\(.+?,.+?\)/g
		.test(decipherBody);

	// a=ze(a,g);
	var swapOutOfBody = /.{1,3}=(.+?)\(.+?,.+?\);/g
		.test(decipherBody);

	/** keep it sync! */

	var solution = undefined;

	if(hasArrManipObj){ solution = 'arrManipObjName'; }
	else if(hasVarDecSwapObj){ solution = 'varDecSwapObj'; }
	else if(swapOutOfBody){ solution = 'swapOutOfBody'; }
	else return self.retry('We got no solution for this `problem`!'); 

	log('Decipher solution: ' + cls({ t: solution, c: 'green', s: 'bold'}));

	var solutions = swapSolutions;

	if(solutions[solution] && typeof solutions[solution] === 'function'){
		try {
			decipherBody = solutions[solution](decipherBody, html5player, self);
		}
		catch(e){
			return self.retry('In try catch: `' + e
				+ '` .  Meaning we could not fix decipherBody');
		}
	}
	else{
			return self.retry('No solution in swapSolutions.js found: '
				+ 'solutions[solution] && typeof solutions[solution]');
	}
		
	try {
		self.d.decipherSig = new Function(decipherBodyfirstCharAsArg, decipherBody);
		if(typeof self.d.decipherSig !== 'function')
			return self.retry("typeof self.d.decipherSig !== 'function'")
	}
	catch(e){
		return self.retry('In try catch: `' + e 
			+ '` .  Meaning, we could not create `self.d.decipherSig` function.');
	}

	return self.next();
};

Decipherer.prototype.completeUrl = function (){
	var self = this,
			dl = self.dl;

	dl.d.dlUrl = dl.d.dlUrl + '&signature=' + self.d.decipherSig(dl.d.cipheredSig);

	if(dl.d.dlUrl.indexOf(',') !== -1)
		dl.d.dlUrl = dl.d.dlUrl.split(',')[0]

/*
  DUMP('dl.d.dlUrl', dl.d.dlUrl);
  return self.f_abort('DEBUGGER');
*/

	self.next();
};

Decipherer.prototype.onAbort = function (){
	this.dl.retry('Decipherer f_abort, calling: dl.retry()');
	//this.dl.f_abort('Decipherer cant finish');
};

Decipherer.prototype.onFinish = function (){
	this.dl.next();
};

Decipherer.prototype.onNext = function (o){
	if(process.LOGNEXT && o && o.fn)
		log("'next' f_ task: " + o.fn);
};

Decipherer.prototype.onRetry = function (err){
	this.dl.errs.push('Dl->' + err);
	this.dl.socketEmit('deciphererRetry');
};

module.exports = Decipherer;