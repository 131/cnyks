"use strict";

const prompt   = require('./prompt');
const toBool   = require('nyks/lang/toBool');

const bool_prompt  = function(msg, base) {

  return prompt(msg + (base ? "[Y/n]" : "[y/N]")).then((response) => {
    response = response.toLowerCase();

    if(response && ["yes", "y", "no", "n"].indexOf(response) == -1) {
      console.error("Please type [yes] or [no]");
      return bool_prompt(msg, base);
    }
    response = response ? toBool(response) : base;
    return response;
  });
};

module.exports = bool_prompt;
