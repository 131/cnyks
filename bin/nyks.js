var Cnyks     = require('../lib');
var parseargs = require('nyks/process/parseargs');

var cmdline        = process.argv.slice(2);
var cmdline_parsed = parseargs(cmdline);


Cnyks.start(cmdline_parsed.args[0], cmdline_parsed.dict);