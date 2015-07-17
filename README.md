prodl (WIP)
=====

A super easy to use Youtube downloader.

[![Code Climate](https://codeclimate.com/github/opensoars/prodl/badges/gpa.svg)](https://codeclimate.com/github/opensoars/prodl)
[![Inline docs](http://inch-ci.org/github/opensoars/prodl.svg?branch=master)](http://inch-ci.org/github/opensoars/prodl)
[![Dependency Status](https://david-dm.org/opensoars/prodl.svg)](https://david-dm.org/opensoars/prodl)
[![devDependency Status](https://david-dm.org/opensoars/prodl/dev-status.svg)](https://david-dm.org/opensoars/prodl#info=devDependencies)

---


## Currenlty working
* Running back-end process
* Working download button on Youtube video pages
* Chrome extension
    - Downloads when a video url or id is entered
    - Downloads entire bookmark folders with search functionality


## Why it rocks
* A platform independent system.
  - Linux using `avconv`
  - Windows using the `avconv` port `ffmpeg`
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


## Install
* Make libav/ffmpeg available to command line.
* Clone source code. 
* Add chrome extension from extension folder. 
* Run the following command in terminal `node server.js /download/location`


## Program [flow chart](https://raw.githubusercontent.com/opensoars/prodl/master/doc/flowCharts/flowChart.png)


## License
[MIT License](https://github.com/opensoars/prodl/blob/master/LICENSE)
