"use strict";

//cnyksify, a browserify plugin
//see README.md for details
const sprintf = require('util').format;
const path = require('path');
const Transform  = require('stream').Transform;

module.exports = function(b) {

  var entries = b._options.entries;
  var sources = typeof entries == "string" ? [entries] : entries;
  var source = path.resolve(sources[0]);

  if(sources.length != 1)
    throw "Cnyksify does not support for multiples entries";


  var mod = require(source);
  var expose = mod.name || 'app';

  console.error("Remap %s as app entry", source);

  //re-require source (already in entry, but now exposed)
  b.require(source, { entry : true, expose});
  b.require('cnyks', {expose : 'cnyks'});

  //register bundle suffix & prefix
  var suffix = sprintf("require('cnyks')(require('%s'));", expose);
  var prefix = "#!/usr/bin/env node\n";

  var transform = function(buf, enc, next) {
    if(prefix)
      prefix = this.push(prefix) && false;

    this.push(buf);
    next();
  };
  var flush = function() {
    this.push(suffix);
    this.push(null);
  };

  b.pipeline.get("wrap").unshift(new Transform({transform, flush}));
};
