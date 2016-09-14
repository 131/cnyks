#!/usr/bin/env node
"use strict";

const Cnyks     = require('../lib');
const parseargs = require('nyks/process/parseArgs');
const box       = require('nyks/cli/box');
const path      = require('path');
const read      = require("read");

const promisify  = require("nyks/function/promisify");

const cmdline        = process.argv.slice(2);
const cmdline_parsed = parseargs(cmdline);


if(!cmdline.length) {
  var man = require('../package.json');
  return process.stderr.write(box("cnyks", JSON.stringify({
    version : man.version, path : __dirname
  }, null, 2) ));
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

cmdline_parsed.dict["ir://name"]   = module_name;
cmdline_parsed.dict["ir://stderr"] = process.stderr.write.bind(process.stderr);
cmdline_parsed.dict["ir://stdout"] = process.stdout.write.bind(process.stdout);
cmdline_parsed.dict["ir://prompt"] = promisify(read);


Cnyks.start(module, cmdline_parsed.dict);