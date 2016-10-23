#!/usr/bin/env node
"use strict";

const cmdline        = process.argv.slice(2);
const parseargs = require('nyks/process/parseArgs');
const cmdline_parsed = parseargs(cmdline);

var browserify = require('browserify', {});
var b = browserify({builtins      : false, commondir     : false, detectGlobals : false})
  .require("cnyks/lib/bundle", {expose:'cnyks'})
  .require(process.argv[2], {expose:'app'});

  if(typeof cmdline_parsed.dict.ignore == "string") 
    cmdline_parsed.dict.ignore = [cmdline_parsed.dict.ignore]

  if(cmdline_parsed.dict.ignore)
    cmdline_parsed.dict.ignore.forEach(name => b.ignore(name) );



  b.plugin('browserify-wrap', {
      suffix  : "require('cnyks')(require('app'));",
      prefix : "#!/usr/bin/env node\nvar ",
  })
  .bundle().pipe(process.stdout);
