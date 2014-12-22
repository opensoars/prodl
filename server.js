var startTime = new Date().getTime();

var Ezlog = require('ezlog'),
    cls = require('opensoars_cls'),
    log = new Ezlog({ pref: { t: '[server]', c: 'green' } });


/** Get 3rd command line argument, high on stack, so no reqs for nuthin */
process.DLFOLDER = 'D:/Muziek/prodldev/';
if(!process.argv[2]) log('!process.argv[2]');
else process.DLFOLDER = process.argv[2];
log('So, files will be stored in ' + process.DLFOLDER);

/** Simple version logger */
log('Prodl version: '
  + cls({ s: 'bold', c: 'blue', t: require('./package.json').version })
);


/** Module Dependencies */
var http = require('http'),
    ws = require('ws'),
    fs = require('fs');

var wsAPI = require('./lib/apis/ws'),
    httpAPI = require('./lib/apis/http');


/** Module globals */
var HTTP_PORT = 3332,
    HTTPS_PORT = 3333,
    WS_PORT = 3334;


/** App globals */
process.DIRNAME = __dirname;
process.DOWNLOADS = [];
process.IDSOCKETS = {};
process.OS = require('os').platform();
process.BITRATE = '128k';
process.TEMPFOLDER = __dirname + '/temp/';
process.DUMPFOLDER = __dirname + '/dump/';
process.LOGPROGRESS = true;
process.CPLOGALL = false;
process.LOGNEXT = true;
process.DownloadMaxRetries = 100;


/** HTTP server initialization, in module routing to httpAPI */
http.createServer(function (req, res){
  var url = req.url;

  switch(req.method){
    case 'GET':

      if(url.indexOf('/requestDownload') !== -1) 
        return httpAPI.dlHandler(req, res);

      else if(url.indexOf('/ping') !== -1)
        return res.end('succes');

    break;

    case 'PUT': res.end(''); break;
    case 'POST': res.end(''); break;
    case 'DELETE': res.end(''); break;
    default: res.end('Nothing to be found on this route!');
  }
}).listen(HTTP_PORT);


/** Initialize websockets, in module routing to wsAPI */
var WebSocketServer = ws.Server,
    wss = new WebSocketServer({port: WS_PORT});

/** Websocket routing
 */
wss.on('connection', wsAPI.onConnection);


/** How long did it take to boot Prodl? */
var timeTaken = (new Date().getTime()-startTime);


// Notify about startup
log('HTTP    initialized at port: ' + HTTP_PORT + '.');
log('Sockets initialized at port: ' + WS_PORT + '.');
log('Prodl is ready for business!');
log('Startup took: ' + cls({ c:'green', t: timeTaken }) + ' ms');


// Dirs cleanup, @ bottom of stack cuz of (no) importancy
require('./lib/tempCleaner');
require('./lib/dumpCleaner');