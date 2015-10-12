"use strict";

var parsearg    = require('./parsearg');
var stripEnd   = require('nyks/string/stripEnd');
var stripStart = require('nyks/string/stripStart');

var lineSplitter = new RegExp("^\\s*\\* ?(.+)", "mg");



function parse(str) {
  if(!str)
    return false;

  var res = [];
    //unix style LF
  str = str.replace("\r\n", "\n").trim();
  str = stripEnd(stripStart(str, "/*"), "*/");

  var args = {}, doc = [], line, tmp;
  while( line  = lineSplitter.exec(str)) {

    if(tmp = parsearg(line[1])) {
      if(!args[tmp.key])
        args[tmp.key] = {computed : null, values : [] };

      args[tmp.key]['values'].push(tmp.body);
      args[tmp.key]['computed'] = tmp.body;
    } else doc.push(line[1]);
  }
  

  return {
    args : args,
    doc  : doc,
  }

}


module.exports = parse;
