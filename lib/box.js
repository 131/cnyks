"use strict";

const sprintf  = require('nyks/string/format');
const repeat   = require('mout/string/repeat');
const truncate = require('nyks/string/truncate');

const CRLF       = "\r\n";

//const STR_PAD_LEFT  = "left";
const STR_PAD_RIGHT = "right";
const STR_PAD_BOTH  = "both";



var pad = function(str, pad, mode, mask, pad_len) {

  pad_len -= sprintf(mask, str).length;
  var left = (mode == STR_PAD_BOTH) ? Math.floor(pad_len / 2) : 0;

  return sprintf(mask,
    repeat(pad, Math.max(left, 0)) + str + repeat(pad, Math.max(pad_len - left, 0)));
};



var box = function(/*[title, msg]*/) {
  var args = [].slice.call(arguments);
  var resp = "";

  if(!args.length)
    return resp;

  var pad_len = 76;

  if(typeof args[0] == "object") {
    let opt = args.shift();
    if(opt.cols)
      pad_len = opt.cols;
  }

  for(let msg, a = 1; a < args.length; a += 2) {
    msg = args[a];
    if(typeof msg !== "string")
      msg = JSON.stringify(msg, null, 2);

    msg = msg.trim().replace("	", "    ").split(/\r?\n/);//use 4 tab indent
    msg = msg.map(line => truncate(line,  pad_len - 2));
    args[a] = msg;
  }


  for(let a = 0; a < args.length; a += 2) {
    resp += pad(" " + args[a] + " ", "═", STR_PAD_BOTH, a ? "╠%s╣" : "╔%s╗", pad_len) + CRLF;
    args[a + 1].forEach(function(line) {
      resp += pad(line, " ", STR_PAD_RIGHT, "║%s║", pad_len) + CRLF;
    });
  }
  resp += pad('', "═", STR_PAD_BOTH, "╚%s╝", pad_len) + CRLF;

  return resp;
};


module.exports = box;
