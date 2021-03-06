"use strict";

var expect       = require("expect.js");
const cp         = require('child_process');


const drain      = require('nyks/stream/drain');

describe("Test mirrors", function() {
  this.timeout(5 * 1000);

  it("should test mirror (scalar)", async function() {
    var args = [];

    args.push("bin/cnyks.js", "./test/data/fuu.js", "--ir://raw", "--ir://run=mirror", "--foo=42");
    var child = cp.spawn(process.execPath, args);
    var payload = await drain(child.stdout);
    expect(Buffer.isBuffer(payload)).to.be.ok();
    expect(payload.toString("utf-8").trim()).to.eql("42");

  });

  it("should test mirror (json)", async function() {
    var args = [];

    var foo = {"this" : "is", "a" : ["complex", null, 45, "object"]};
    args.push("bin/cnyks.js", "./test/data/fuu.js", "--ir://raw", "--ir://run=mirror", "--foo::json=" + JSON.stringify(foo));
    var child = cp.spawn(process.execPath, args);
    var payload = await drain(child.stdout);
    expect(JSON.parse(payload.toString("utf-8"))).to.eql(foo);

  });


});

