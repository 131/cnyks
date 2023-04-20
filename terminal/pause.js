"use strict";

const read     = require('read');

const pause  = function(msg) {
  if(msg) console.error(msg);
  return prompt({prompt : `Press [Enter] to continue.`, silent :true});
};

module.exports = pause;
