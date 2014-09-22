var Ezlog = require('ezlog'),
		log = new Ezlog({
			pref: { t: '[sockets]', c: 'cyan' }
		});
		
var DUMP = require('DUMP');


var onConnection = function (ws){

	ws.sendJSON = function (json){ ws.send(JSON.stringify(json)); };

	ws.sendJSON({type: 'socketConnection'});

	ws.on('close', function (){

		if(process.IDSOCKETS[ws.v]){
			var index = process.IDSOCKETS[ws.v].indexOf(ws)

			if(index !== -1)
				process.IDSOCKETS[ws.v].splice(index, 1);
		
			if(process.IDSOCKETS[ws.v].length === 0)
				delete process.IDSOCKETS[ws.v];
			
		}
	});

	ws.on('message', function(data) {
		if(data.charAt(0) === '{') data = JSON.parse(data);
		else return false;

		var type = data.type;

		if(type === 'setV')
			setV(data.v);

	});

	function setV(v){

		if(!process.IDSOCKETS[v])
			process.IDSOCKETS[v] = [];

		if(process.IDSOCKETS[v].indexOf(ws) === -1)
			process.IDSOCKETS[v].push(ws);

		ws.v = v;
	}

};

module.exports = {
	onConnection: onConnection
};