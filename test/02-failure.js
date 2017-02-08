"use strict";

var expect       = require("expect.js");
const path       = require('path');
const stream     = require('stream');
const cp         = require('child_process');
const startsWith = require('mout/string/startsWith');

const cnyks      = require('../lib');
const defer      = require('nyks/promise/defer');
const sleep      = require('nyks/function/sleep');


describe("Testing simple class reflection", function(){
  this.timeout(5 * 1000);

  var child;
    var args = ["node_modules/istanbul/lib/cli.js", "--preserve-comments", "cover", "--dir", "coverage/child2", "--report", "none", "--print", "none"];

    args.push("bin/cnyks.js", "--", "./test/data/fuu.js", "--ir://json")


  function * waitprompt() {
    if(!child)
      child = cp.spawn(process.execPath, args);

    var line = yield drain(child.stdout);
    yield sleep(1000);
    if(startsWith(line, "$fuu.js :"))
      return;
    throw "Invalid prompt" + line;
  }

  function * drain(stream) { //nyks that?
    var defered = defer();
    stream.removeAllListeners("data");
    stream.once("data", function(buf){
      defered.resolve(("" + buf).trim())
    });
    return defered;
  }


  it("should wait for runner prompt", waitprompt);
  it("should test for a failure prompt/bool", function* () {

    child.stdin.write("failure\n");
    //var line = yield drain(child.stdout);
    var stderr = yield drain(child.stderr);

    expect(stderr).to.match(/NICHT KEINE NEIN NEIN NEIN/);
    child.kill();

  });



});

