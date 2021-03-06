#!/usr/bin/env node
"use strict";

const path      = require('path');
const box       = require('../lib/box');
const bundle    = require('../lib/bundle');

process.argv.splice(1, 1); //exclude cnyks from command line

const cmdline        = process.argv.slice(1); //strip node binary


if(!cmdline.length) {
  var man = require('../package.json');
  process.stderr.write(box("cnyks", JSON.stringify({
    version : man.version, path : __dirname
  }, null, 2)));
  process.exit();
}

var module_path = cmdline[0];
var module_name = path.basename(module_path);


try {
  try {
    module_path = require.resolve(module_path);
  } catch(e) {
    try {
      module_path = require.resolve(path.resolve(module_path));
    } catch(e) {
      module_path = require.resolve(path.resolve("node_modules", module_path));
    }
  }
} catch(e) {
  throw Error(`Invalid module name, ${module_name}`);
}

var module = require(module_path);


bundle(module, module.name || module_name);
