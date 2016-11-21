"use strict";

var expect       = require("expect.js");
const path       = require('path');
const stream     = require('stream');
const cp         = require('child_process');
const startsWith = require('mout/string/startsWith');

const cnyks      = require('../lib');
const defer      = require('nyks/promise/defer');


describe("Testing simple class reflection", function(){
  this.timeout(5 * 1000);

  var child;
  before(function(){

    var args = ["node_modules/istanbul/lib/cli.js", "--preserve-comments", "cover", "--dir", "coverage/child2", "--report", "none", "--print", "none"];

    args.push("bin/cnyks.js", "--", "./test/data/fuu.js", "--ir://json")
    child = cp.spawn(process.execPath, args);

  });


  function * waitprompt() {
    var line = yield drain(child.stdout);
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

  it("should test for a failure prompt/bool", function* (chain) {

    child.stdin.write("failure\n");
    var stdout = "",  stderr = "";

    child.stdout.on("data", function(buf){stdout += buf});
    child.stderr.on("data", function(buf){stderr += buf});

    //var line = yield drain(child.stdout);
    //var line2 = yield drain(child.stdout);


    child.on('exit', function(exit){
      expect(stderr).to.match(/NICHT KEINE NEIN NEIN NEIN/);
      expect(exit).to.eql(1);
      chain();
    });

  });



});

