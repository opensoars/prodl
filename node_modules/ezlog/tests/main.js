var Ezlog = require('../lib/ezlog.js');

var log = new Ezlog({

	pref: {
		t: '[main test]',
		c: 'green',
		s: ['underline', 'bold']
	},

	text: {
		c: 'blue',
		s: 'bold'
	}

});

if(typeof log !== 'function') return console.log("typeof log !== 'function'");

log('hello', 'world');

log({
	a: 'b'
});
