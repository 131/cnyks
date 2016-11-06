"use strict";

const expect   = require("expect.js");
const path     = require('path');
const stream   = require('stream');
const cp       = require('child_process');
const startsWith = require('mout/string/startsWith');

const cnyks    = require('../lib');

/**
* This test suite is applied from the inside of interactive runner
* mocha manage process.stdin workflow properly (and unref it when switching to another test file)
*/

describe("Internal lookup", function(){

  it("Should allow new alias registration", function() {

    var child = cnyks.start(require("./data/fuu.js"));
    expect(child.command_alias("runner", "quit", "qq")).to.be(undefined);
    expect(child.command_alias("runner", "quita", "qq")).to.be(false);
    process.stdin.unref();
 });

  it("Should also scan instances", function() {
    var fuu = require("./data/fuu.js");
    var child = cnyks.start(new fuu());
    expect(child.command_alias("runner", "quit", "qq")).to.be(undefined);
    expect(child.command_alias("runner", "quita", "qq")).to.be(false);
    process.stdin.unref();
 });


  it("Should execute command provided on start", function(done) {

    var collect = function(what){
      collect[what] = '';
      return function(msg){
        collect[what] += msg;
      }
    }
    var child = cnyks.start(require("./data/fuu.js"), {
      "ir://json": true, "ir://start" : "sum", "a" : 3, "b" : 5,

      "ir://stderr" : collect("stderr"),
      "ir://stdout" : collect("stdout"),
      "ir://prompt" : function(){ return Promise.resolve("quit\n") ;},
    });

    setImmediate(function(){
      expect(collect.stdout).to.eql(8);
      done();
    });
 });




  it("Should fail on invalid class inspection", function() {
    expect(function(){
      cnyks.start(require("./data/invalid.js"), {"ir://json": true});
    }).to.throwError();

 });


});

