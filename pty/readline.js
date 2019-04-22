"use strict";

const defer = require('nyks/promise/defer');

const readline = async function(opt) {

  let defered = defer();
  let line = "";

  let draw = () => {
    //this.stderr.write('\x1b[2K'); // erase all line
    this.stderr.write(`\r${opt.prompt}${line}`);
    this.stderr.write('\x1b[K'); //erase right
  };

  draw();

  function read(buf) {
    if(buf == "\x0d") { //enter
      this.stdin.removeListener("data", read);
      defered.resolve(line);
      this.stderr.write("\r\n");
      return;
    }
    if(buf == "\x03") { //cancel
      this.stdin.removeListener("data", read);
      defered.reject(Error("canceled"));
      return;
    }

    if(buf == "\x7f") //backslash
      line = line.substr(0, line.length - 1);

    if(/^[ -~]+$/.test(buf)) //printable
      line = line + buf;

    draw();
  }

  this.stdin.on("data", read);
  return defered;
};


module.exports = readline;
