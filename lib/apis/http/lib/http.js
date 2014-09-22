var Ezlog = require('ezlog'),
		log = new Ezlog({
			pref: {t: '[httpAPI.dlHandler]', c: 'blue' }
		});


var Dl = require('../../../Download'),
		f_ = require('f_');

/**
 * Augment Download Class in order to make f_ API work.
 * Ofcourse we're not doing this in dlHanlder scope, since we
 * add proto props.
 */
Dl = f_.augment(Dl, 'Download', 'Dl');


function dlHandler (req, res){
	var dlNs = {};

	function endJson(json){
		json = json || {};
		res.writeHead(200, {'Content-type': 'application/json'});
		return res.end(JSON.stringify(json));
	}

	var vMatch = /v=(.+)/.exec(req.url);

	if(!vMatch)
		return endJson({ errs: ['@dlHandler  no video match!'] });
	
	var v = vMatch[1];

	if(process.DOWNLOADS.indexOf(v) !== -1){
		log('Download: `' + v + '` already present');
		return endJson({ errs: ['@dlHandler  download already present'] });
	}

	process.DOWNLOADS.push(v);

	dlNs.dl = new Dl({ v: v }).start();

	if(dlNs.dl.errs.length === 0) return endJson({ status: 'started' });
	
	else{
		endJson({ errs: dlNs.dl.errs });
		return delete dlNs.dl;
	}
}


module.exports = {
	dlHandler: dlHandler
};

