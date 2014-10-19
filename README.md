prodl
=====

[![Build Status](https://travis-ci.org/opensoars/prodl.svg?branch=master)](https://travis-ci.org/opensoars/prodl)

A super easy to use Youtube downloader.


## Why it owns all other Youtube downloaders
* A platform independent system.
  - Linux using `avconv`
  - Windows using `ffmpeg`
* Chrome extension which augments Youtube it's DOM.
* Stay immersed in your musical journey by never leaving the Youtube page for a download. Everything is right there, where you need it, inside Youtube it's DOM!
* Back-end system that takes hundreds of downloads at the same time.
* Bidirectional communication between extension and back-end.
* A simple extension popup which allows you to type a Youtube video id, and start a download from there.

## Dependencies
* [node.js](http://www.nodejs.org)
* [f_](//github.com/opensoars/f_)
* [ezlog](//github.com/opensoars/ezlog)
* [cls](//github.com/opensoars/cls)
* [ws](//github.com/einaros/ws)
* [libav](//www.google.nl/search?q=libav), with libmp3lame

## Program [flow chart](https://raw.githubusercontent.com/opensoars/prodl/master/doc/flowCharts/flowChart.png)

## Examples (API)
Showing you how it's done, a little bit..

## TODO
* When a song is converted and saved in `temp` folder. We need a way to check if it's a valid mp3 file. Read metadata? Estimate byte size? I already noticed it sometimes is a 0 byte file, easy to fix from there!

### Starting a download
Initialize a new f_ augmented `dl` instance from `Dl` / `Download`, providing it with a Youtube video id.

Call the instance it's start method.

After that you can check if everything has started correctly by checking the `errs` array property. And then for example notify a user, or end `/downloadRequest` HTTP response with up to date info. By the way, no long polling here! Just checking for required properties / methods synchronously. After that the f_ async module takes over.

```js
var f_ require('f_'),
    Dl = require('Download');

Dl = f_.augment(Dl);

var dl = new Dl({v: 'NnTg4vzli5s'});

dl.start();

// Let's check if the download has started
if(dl.errs.length === 0){
  // ... Nice
}
else{
  // ... Atleast we know
}
```

### Using the [f_](https://github.com/opensoars/f_) API
It's like promises, really quite easy. Say you have a 'class' or better said, a prototype object. From which a lot of instances are drawn and they all perform asynchronous tasks which can take up to minutes to complete. And you aren't happy with christmas tree code, f_ comes in (with it's simple API).

Let's start with required prototype object properties. (Using the `Download` as example)
```js
// All the functions to run through in order.
Download.prototype.functionFlow = ['getSource', 'getCode', 'evalCode', 'etc..'];

// There maybe data which we want to reset when a reset happens.
// In this case `d` (where ready to use data is stored).
Download.prototype.toReset = [ { d: {} } ];
```


Now let's take a look at how to use the f_ API. In this case inside the `Download` function scope.
```js
Download.prototype.getSource = function (){
  var self = this,
      url = 'http://www.youtube.com/watch?v=' + this.v;

  http.get(url, function (res){
    var src = ''; res.on('data', function(c){ src+=c; });

    res.on('end', function (){
      if(src.length < 5000)
        return self.retry('src.length < 5000'); // 1*

      self.d.src = src;
      return self.next(); // 2*
    });

  }).on('error', function (){
    return self.retry('http.get error'); // 3*
  });
};
```
1. If the source code length is way to short, retry with an error msg. The error message will be prefixed with @getSource. And using the logger function Resulting in: `[Dl] @getSource  src.length < 5000`
2. Let's move on to the next function, the `getSource` task has been completed.
3. Same as 1, this time resulting in logging [Dl] @getSource  http.get error

## Install
* Make libav/ffmpeg available for command line.
* Clone source code. 
* Add chrome extension from extension folder. 
* Run the following command in terminal `node server.js /download/location`

## License
[MIT License](https://github.com/opensoars/prodl/blob/master/MITlicense)

## Notice
Google is using a lame enciphered signature with some videos, it's really quite weird. When you `GET` info about the video, you sometimes see this flag: `use_ciphered_signature: true`. So logically you think those videos are enciphered. But that isn't even true. It's really a LAME way to try to get security through obfuscation. But anyway, the decipher function sits obfuscated and minified somewhere in the Youtube source. But since they use the 'lovely' closure compiler, we can't even search for function names etc... We need to do some pattern recognition. Which ain't such a biggie, but Google updates this function multiple times per week. So far I've managed to get a working version of Prodl for every update, and all the logic is still in the code. So all previous ways of finding the decipher function will work forever. Meaning that at some point, all patterns are recognized and no more updates are required!
