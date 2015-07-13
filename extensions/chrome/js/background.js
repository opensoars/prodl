var chrome = chrome || {};

/**
 * Top level application namespace.
 * @namespace
 */
var app = {};

/**
 * Application event handlers namespace
 * @namespace
 */
app.handlers = {
  onMsg: function (req, sender, sendRes) {
    app.helpers.sendMsg(req, sendRes);
  }
};

/**
 * Application helper functions namespace.
 * @namespace
 */
app.helpers = {
  /**
   * Sends messages to the prodl api.
   * Callback action: TBD
   * @param {object} req - Message data from injected.js
   * @param {function} sendRes - Sends message back to injected.js
   */
  sendMsg: function (req, sendRes) {
    var http_req = new XMLHttpRequest();

    http_req.open('POST', 'http://localhost:3333/api/downloads/' + req.v);

    http_req.onreadystatechange = function (){
      if (this.readyState === 4) {
        console.log('req done');
      }
    };

    http_req.send();

    sendRes({});
  },

  /**
   * Used to bind all application events.
   */
  addEventListeners: function () {
    chrome.runtime.onMessage.addListener(app.handlers.onMsg);
  }
};

/**
 * Application initialization function.
 */
app.init = function () {
  app.helpers.addEventListeners();
};

// Leggo
app.init();