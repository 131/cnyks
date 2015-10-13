"use strict";

var filter   = require('mout/array/filter');
var combine  = require('nyks/object/combine');
var parsedoc = require('./parsedoc');

var argsSplitter = new RegExp("^function\\s+(\\S*)\\(([\\s\\S]*?)\\)\\s*(/\\*[\\s\\S]*?\\*/)?");






module.exports = function(fn){

    var body = fn.toString(), params = [], comment;

    if(!argsSplitter.test(body))
      throw Error("Invalid closure");

    var q = argsSplitter.exec(body);
    params = filter(q[2].split(/[,\s]+/));
    var doc = q[3], parseddoc = parsedoc(doc);


    return {
      name   : q[1],
      params : combine(params, params),
      doc    : parseddoc,
      rawdoc : doc,
    };
}
