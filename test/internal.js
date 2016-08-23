var expect   = require("expect.js");
var path     = require('path');
var stream   = require('stream');
var cp       = require('child_process');
var startsWith = require('mout/string/startsWith');
var cnyks    = require('../lib');


/**
* This test suite is applied from the inside of interactive runner
* mocha manage process.stdin workflow properly (and unref it when switching to another test file)
*/

describe("Internal lookup", function(){

  it("Should allow new alias registration", function() {

    var child = cnyks.start(path.resolve(__dirname, "data/fuu.js"));
    expect(child.command_alias("runner", "quit", "qq")).to.be(undefined);
    expect(child.command_alias("runner", "quita", "qq")).to.be(false);
    process.stdin.unref();
 });


  it("Should execute command provided on start", function() {

    var child = cnyks.start(path.resolve(__dirname, "data/fuu.js"), {"ir://json": true, "ir://start" : "sum", "a" : 3, "b" : 5 });

 });




  it("Should fail on invalid class inspection", function() {
    expect(function(){
      cnyks.start(path.resolve(__dirname, "data/invalid.js"), {"ir://json": true});
    }).to.throwError();

 });


});

