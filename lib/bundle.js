'use strict';

const Cnyks     = require('./index');
const parseargs = require('nyks/process/parseArgs');
const read      = require('read-merge-28');

const promisify  = require('nyks/function/promisify');


module.exports = function(module, module_name) {

  const cmdline        = process.argv.slice(2);
  const cmdline_parsed = parseargs(cmdline);

  cmdline_parsed.dict['ir://name']   = module_name || module.name || "app";
  cmdline_parsed.dict['ir://stderr'] = process.stderr.write.bind(process.stderr);
  cmdline_parsed.dict['ir://stdout'] = process.stdout.write.bind(process.stdout);
  cmdline_parsed.dict['ir://prompt'] = promisify(read);

  Cnyks.start(module, cmdline_parsed.dict, cmdline_parsed.args, function(err) {
    if(err) {
      console.error("Failure in cnyks", err, err && err.stack);
      throw "Failure in cnyks";
    }
    if(process.stdin.unref)
      process.stdin.unref();
    process.emit('cnyksEnd');
  });
};
