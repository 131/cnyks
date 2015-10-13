#!/usr/bin/env node

var Cnyks     = require('../lib');
var parseargs = require('nyks/process/parseArgs');
var box       = require('nyks/cli/box');

var cmdline        = process.argv.slice(2);
var cmdline_parsed = parseargs(cmdline);

if(!cmdline.length) {
  var man = require('../package.json');
  return box("cnyks", JSON.stringify({
    version : man.version, path : __dirname
  }, null, 2) );
}

Cnyks.start(cmdline_parsed.args[0], cmdline_parsed.dict);