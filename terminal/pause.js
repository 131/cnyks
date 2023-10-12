"use strict";

const read     = require('read');

const pause  = function(msg) {
  if(msg) console.error(msg);
  return read({prompt : `Press [Enter] to continue.`, silent : true});
};

module.exports = pause;
