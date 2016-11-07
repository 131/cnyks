"use strict";

  //cnyksify, a browserify plugin
  //see README.md for details

const path = require('path');
const Transform  = require('stream').Transform;

module.exports = function(b){

  var sources = b._options.entries, source = path.resolve(sources[0]);
  if(sources.length != 1)
    throw "Cnyksify does not support for multiples entries";

  console.error("Remap %s as app entry", source);

    //re-require source (already in entry, but expose as 'app'
  b.require(source, { entry: true, expose: 'app' });
  b.require('cnyks', {expose:'cnyks'});

    //register bundle suffix
  var suffix = "require('cnyks')(require('app'));";

  var transform = function(buf, enc, next) { this.push(buf); next(); };
  var flush = function() { this.push(suffix) ; this.push(null); }

  b.pipeline.get("wrap").unshift(new Transform({transform, flush}));
}