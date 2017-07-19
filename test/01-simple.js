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


  var stdout = [], stderr = [];
  stdout.defer = defer();
  stderr.defer = defer();


  before(function(){

    var args = ["node_modules/istanbul/lib/cli.js", "--preserve-comments", "cover", "--dir", "coverage/child", "--report", "none", "--print", "none"];

    args.push("bin/cnyks.js", "--", "./test/data/fuu.js", "--ir://json")
    child = cp.spawn(process.execPath, args);


    child.stdout.on("data", function(buf){
      stdout.push.apply(stdout, String(buf).trim().split("\n"));
      stdout.defer.resolve();
    });
    child.stderr.on("data", function(buf){
      stderr.push.apply(stderr, String(buf).trim().split("\n"));
      stderr.defer.resolve();
    });

  });

  async function drain(what) {
    if(what.length)
      return what.shift().trim();
    what.defer = defer();
    await what.defer;
    return drain(what);
  }


  async function waitprompt() {
    var line = await drain(stdout);
    if(startsWith(line, "$foo :"))
      return;
    throw "Invalid prompt" + line;
  }



  it("should wait for runner prompt", waitprompt);

  it("should test prompt/bool", async function() {

    child.stdin.write("comfort\n");

    var line = await drain(stdout);
    expect(line).to.eql("you happy ?[Y/n]");

    child.stdin.write("nope\n");

    line = await drain(stderr);
    expect(line).to.eql("Please type [yes] or [no]");

    line = await drain(stdout);//prompt again
    expect(line).to.eql("you happy ?[Y/n]");

    child.stdin.write("yes\n");
    line = await drain(stdout);
    expect(line).to.eql("good for you!");

  });


  it("should prompt the cal in interactive loop", async function() {
    await waitprompt();


    child.stdin.write("\n");
    await waitprompt();

    child.stdin.write("\n");
    await waitprompt();

    child.stdin.write("sum 1 2\n");
    var line = await drain(stdout);
    expect(Number(line)).to.be(3);
  });


  it("should allow promises", async function() {
    await waitprompt();

    child.stdin.write("introduce francois 30\n");
    var line = await drain(stdout);
    expect(line).to.be(JSON.stringify("Hi francois of 31"));

  });

  it("should not prompt for optional args", async function() {
    await waitprompt();

    child.stdin.write("introduce\n");
    var line = await drain(stdout);
    expect(line).to.be(JSON.stringify("Hi martin of 11"));

  });


  it("should prompt for missing args", async function() {
    await waitprompt();

    child.stdin.write("sum\n");
    var line = await drain(stdout);
    expect(line).to.eql("$foo[a]");
    child.stdin.write("1\n");

    var line = await drain(stdout);
    expect(Number(line)).to.be(3);

  });


  it("should go back to prompt on dummy line", async function() {
    child.stdin.write("\n");
    await waitprompt();
  });

  it("should not accept invalid command", async function() {
    child.stdin.write("invalid\n");

    var line = await drain(stderr);
    expect(line).to.be("Error: Invalid command key 'invalid'");
  });


  it("should allow proper help rendering", async function(){
    child.stdin.write("?\n");

    await waitprompt();
    var args = await drain(stderr);
    stderr.unshift(args);

    args = stderr.map(function(line){
      line = line.replace(/[╠═╣║╔╗╚╝]/g, "").trim();
      line = line.replace(/\s+/g, " ");
      return line;
    }).filter(function(a){ return !!a});

    expect(args).to.eql([ '`runner` commands list',
        'list_commands (?) Display all available commands',
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

