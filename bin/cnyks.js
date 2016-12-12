#!/usr/bin/env node
"use strict";

const path      = require('path');
const box       = require('nyks/cli/box');
const bundle    = require('../lib/bundle');

const cmdline        = process.argv.slice(2);


if(!cmdline.length) {
  var man = require('../package.json');
  return process.stderr.write(box("cnyks", JSON.stringify({
    version : man.version, path : __dirname
  }, null, 2) ));
}

var module_path = cmdline[0];
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


bundle(module, module_name);