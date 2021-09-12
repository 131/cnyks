"use strict";

const readline = require('readline');

const prompt = function(prompt) {

  const rl = readline.createInterface({
    input  : process.stdin,
    output : process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

};

module.exports = prompt;
