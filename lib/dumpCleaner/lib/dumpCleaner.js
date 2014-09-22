var Ezlog = require('ezlog'),
		log = new Ezlog({ pref: { t: '[dumpCleaner]', c: 'yellow' } });

var fs = require('fs');

var folder = process.DUMPFOLDER;

fs.readdir(folder, function (err, files){
	if(err)
		return log('fs.readdir(folder) error');

	var file, toDelete
	for(var i=0; i<files.length; i+=1){
		file = files[i];

		if(file.indexOf('keepmehere.gitub.txt') === -1){

			toDelete = folder + file

			fs.unlink(toDelete, function (err){
				if(err)
					return log('Could not delete: ' + toDelete);

				log('Deleted: ' + toDelete);
			});

		}
	}
});


// No need to exports stuff
module.exports = {};