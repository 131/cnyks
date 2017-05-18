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

    var args = ["node_modules/istanbul/lib/cli.js", "--preserve-comments", "cover", "--dir", "coverage/child", "--report", "none", "--print", "none"];

    args.push("bin/cnyks.js", "--", "./test/data/fuu.js", "--ir://json")
    child = cp.spawn(process.execPath, args);

  });


  function * waitprompt() {
    var line = yield drain(child.stdout);
    if(startsWith(line, "$foo :"))
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

  it("should test prompt/bool", function* () {

    child.stdin.write("comfort\n");

    var line = yield drain(child.stdout);
    expect(line).to.eql("you happy ?[Y/n]");

    child.stdin.write("nope\n");

    line = yield drain(child.stderr);
    expect(line).to.eql("Please type [yes] or [no]");

    line = yield drain(child.stdout);//prompt again
    expect(line).to.eql("you happy ?[Y/n]");

    child.stdin.write("yes\n");
    line = yield drain(child.stdout);
    expect(line).to.eql("good for you!");

  });


  it("should prompt the cal in interactive loop", function* () {
    child.stdin.write("\n");
    yield waitprompt();

    child.stdin.write("\n");
    yield waitprompt();

    child.stdin.write("\n");
    yield waitprompt();

    child.stdin.write("sum 1 2\n");
    var line = yield drain(child.stdout);
    expect(Number(line)).to.be(3);
  });


  it("should allow promises", function* () {
    child.stdin.write("\n");
    yield waitprompt();

    child.stdin.write("introduce francois 30\n");
    var line = yield drain(child.stdout);
    expect(line).to.be(JSON.stringify("Hi francois of 31"));

  });

  it("should not prompt for optional args", function* () {
    child.stdin.write("\n");
    yield waitprompt();

    child.stdin.write("introduce\n");
    var line = yield drain(child.stdout);
    expect(line).to.be(JSON.stringify("Hi martin of 11"));

  });


  it("should prompt for missing args", function* () {
    child.stdin.write("\n");
    yield waitprompt();

    child.stdin.write("sum\n");
    var line = yield drain(child.stdout);
    expect(line).to.eql("$foo[a]");
    child.stdin.write("1\n");

    var line = yield drain(child.stdout);
    expect(Number(line)).to.be(3);

  });


  it("should go back to prompt on dummy line", function* () {
    child.stdin.write("\n");
    yield waitprompt();
  });

  it("should not accept invalid command", function* () {
    child.stdin.write("invalid\n");

    var line = yield drain(child.stderr);
    expect(line).to.be("Error: Invalid command key 'invalid'");
  });


  it("should allow proper help rendering", function* (){
    child.stdin.write("?\n");
    var err = "";

    child.stderr.on("data", function(buf){ err += buf; });

    yield waitprompt();

    var args = err.split("\n").map(function(line){
      line = line.replace(/[╠═╣║╔╗╚╝]/g, "").trim();
      line = line.replace(/\s+/g, " ");
      return line;
    }).filter(function(a){ return !!a});

    expect(args).to.eql([ '`runner` commands list',
        'list_commands (?) Display all available commands',
        'replay (r)',
        'quit (q)',
        '`foo` commands list',
        'sum (add, add1) $a, [$b]',
        'failure this is just sad',
        'comfort',
        'introduce [$name, [$age]]',
        'bar $foo',
        'bottom $foo',
    ]);
  });

  it("should quit the runner", function(chain) {

    child.stdin.end("quit\n");
    child.on('exit', function(){
      chain();
    });

    child.stdout.on("data", function(buf){ console.log( ""+buf); });
    child.stderr.on("data", function(buf){ console.log( ""+buf); });
  });



});

