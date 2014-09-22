var cls = require('opensoars_cls');

/**
 * Top level class to draw insances from
 * @o.pref {object}  How to log prefix
 * @o.text {object}  How to log text
 *
 * If the message to log is an object, we JSON stringify it.
 */
function Ezlog(o){
	o = o || {};

	if(!o.pref) o.pref = { t: '', c: 'white', s: '' };
	if(!o.text) o.text = { t: '', c: 'white', s: '' };

	var pref = cls({ t: o.pref.t, c: o.pref.c, s: o.pref.s });

	return function ezlog(){

		for(var i=0, as=arguments; i<as.length; i+=1)
			console.log(
				pref,
				cls({
					t: typeof as[i] === 'object' ? JSON.stringify(as[i]) : as[i],
					c: o.text.c, s: o.text.s
				})
			);
		
	};

}

module.exports = Ezlog;