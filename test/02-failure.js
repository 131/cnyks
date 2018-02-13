"use strict";
/* eslint-env node,mocha */

var expect       = require("expect.js");
const cp         = require('child_process');
const startsWith = require('mout/string/startsWith');

const defer      = require('nyks/promise/defer');


describe("Test crash prompt", function() {
  this.timeout(5 * 1000);

  var child;
  var args = ["node_modules/istanbul/lib/cli.js", "--preserve-comments", "cover", "--dir", "coverage/child2", "--report", "none", "--print", "none"];

  args.push("bin/cnyks.js", "--", "./test/data/fuu.js", "--ir://json");


  async function waitprompt() {
    var line = await drain(child.stdout);
    if(startsWith(line, "$foo :"))
      return;
    throw "Invalid prompt" + line;
  }

  async function drain(stream) { //nyks that?
    var defered = defer();
    stream.removeAllListeners("data");
    stream.once("data", function(buf) {
      defered.resolve(("" + buf).trim());
    });
    return defered;
  }

  child = cp.spawn(process.execPath, args);

  it("should wait for runner prompt", waitprompt);
  it("should test for a failure prompt/bool", async function() {

    child.stdin.write("failure\n");
    //var line = await drain(child.stdout);
    var stderr = await drain(child.stderr);

    expect(stderr).to.match(/NICHT KEINE NEIN NEIN NEIN/);
    child.kill();

  });



});

