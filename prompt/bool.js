"use strict";

const read     = require('read-merge-28');
const promisify = require('nyks/function/promisify');
const prompt   = promisify(read);
const toBool = require('nyks/lang/toBool');

const bool_prompt  = function*(msg, base){
  var response = (yield prompt({prompt:  msg + (base ? "[Y/n]" : "[y/N]")})).toLowerCase();

  if(response && ["yes", "y", "no", "n"].indexOf(response) == -1) {
    console.error("Please type [yes] or [no]");
    return yield bool_prompt(msg, base);
  }

  response = response ? toBool(response) : base;
  return response;
}

module.exports = bool_prompt;