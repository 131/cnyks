"use strict";

//cnyksify, a browserify plugin
//see README.md for details
const path = require('path');
const Transform  = require('stream').Transform;

module.exports = function(b) {

  var entries = b._options.entries;
  var sources = typeof entries == "string" ? [entries] : entries;
  var source = path.resolve(sources[0]);

  if(sources.length != 1)
    throw "Cnyksify does not support for multiples entries";



  console.error("Remap %s as app entry", source);

  //re-require source (already in entry, but now exposed)
  b.require(source, { entry : true, expose : 'app'});
  //  b.require('cnyks', {expose : 'cnyks'});
  b.require('cnyks/lib/bundle', {expose : 'cnyks/lib/bundle'});

  //register bundle suffix & prefix
  var suffix = "require('cnyks/lib/bundle')(require('app'));";
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
