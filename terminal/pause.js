"use strict";

const read     = require('read-merge-28');
const promisify = require('nyks/function/promisify');
const prompt   = promisify(read);

const pause  = function(msg) {
  if(msg) console.error(msg);
  return prompt({prompt : `Press [Enter] to continue.`, silent :true});
};

module.exports = pause;
