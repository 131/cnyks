"use strict";

const expect   = require("expect.js");
const path     = require('path');
const stream   = require('stream');
const cp       = require('child_process');
const startsWith = require('mout/string/startsWith');
const sleep      = require('nyks/async/sleep');
const defer      = require('nyks/promise/defer');

const cnyks    = require('../lib');

/**
* This test suite is applied from the inside of interactive runner
* mocha manage process.stdin workflow properly (and unref it when switching to another test file)
*/

describe("Internal lookup", function(){

  var name = "fuu";

  async function waitprompt() {
    var line = await drain('stdout');
    if(startsWith(line, `$${name} :`))
      return;
    throw "Invalid prompt" + line;
  }


  var collect = {};

  var prepare = function(what) {
    collect[what] = [];
    collect[what].defer = defer();
    return function(stuff) {
      collect[what].push.apply(collect[what], stuff.trim().split("\n"));
      collect[what].defer.resolve();
    }
  }

  async function drain(what) {
    if(collect[what].length)
      return collect[what].shift().trim();
    collect[what].defer = defer();
    await collect[what].defer;
    return drain(what);
  }


  var stdout = prepare('stdout');
  var stderr = prepare('stderr');
  var stdin  = prepare('stdin');

  async function prompt(opts) {
    stdout(opts.prompt);
    return await drain("stdin");
  }


  var child = cnyks.start(require("./data/fuu.js"),  {
    "ir://json"   : true,
    "ir://name"   : name,
    "ir://stderr" : stderr,
    "ir://stdout" : stdout,
    "ir://prompt" : prompt,
  });

  it("Should allow new alias registration", function() {
    expect(child.command_alias("runner", "quit", "qq")).to.be(undefined);
    expect(child.command_alias("runner", "quita", "qq")).to.be(false);
 });

  it("Should also scan instances", function() {
    var fuu = require("./data/fuu.js");
    var child = cnyks.start(new fuu());
    expect(child.command_alias("runner", "quit", "qq")).to.be(undefined);
    expect(child.command_alias("runner", "quita", "qq")).to.be(false);
 });


  it("Should execute command provided on start", async function () {


    var child = cnyks.start(require("./data/fuu.js"),  {
      "ir://json"   : true,
      "ir://name"   : name,
      "ir://stderr" : stderr,
      "ir://stdout" : stdout,
      "ir://prompt" : prompt,

      "ir://start" : "sum", "a" : 3, "b" : 5,
    });

    await waitprompt();

    var line = await drain('stdout');
    expect(line).to.eql(8);

    await waitprompt();

    stdin("sum 1 5");
    var line = await drain('stdout');
    expect(line).to.eql(6);

 });


  it("Should fail on invalid class inspection", function() {
    expect(function(){
      cnyks.start(require("./data/invalid.js"), {"ir://json": true});
    }).to.throwError();

 });


});

