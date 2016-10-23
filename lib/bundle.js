'use strict';

const Cnyks     = require('./index');
const parseargs = require('nyks/process/parseArgs');
const read      = require('read');

const promisify  = require('nyks/function/promisify');


module.exports = function(module, module_name){

  const cmdline        = process.argv.slice(2);
  const cmdline_parsed = parseargs(cmdline);

  cmdline_parsed.dict['ir://name']   = module_name || "app";
  cmdline_parsed.dict['ir://stderr'] = process.stderr.write.bind(process.stderr);
  cmdline_parsed.dict['ir://stdout'] = process.stdout.write.bind(process.stdout);
  cmdline_parsed.dict['ir://prompt'] = promisify(read);
  Cnyks.start(module, cmdline_parsed.dict);
}