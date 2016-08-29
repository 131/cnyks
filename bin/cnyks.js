#!/usr/bin/env node
"use strict";

var Cnyks     = require('../lib');
var parseargs = require('nyks/process/parseArgs');
var box       = require('nyks/cli/box');
var path      = require('path');

var cmdline        = process.argv.slice(2);
var cmdline_parsed = parseargs(cmdline);


if(!cmdline.length) {
  var man = require('../package.json');
  return box("cnyks", JSON.stringify({
    version : man.version, path : __dirname
  }, null, 2) );
}


var module_path = cmdline_parsed.args[0];
var module_name = path.basename(module_path);



try {
  try {
    module_path = require.resolve(module_path);
  } catch (e) { 
    module_path = path.resolve(module_path);
    require.resolve(module_path);
  }
} catch (e){
  throw Error("Invalid module name");
}

var module = require(module_path);

cmdline_parsed.dict["ir://name"] = module_name;


Cnyks.start(module, cmdline_parsed.dict);