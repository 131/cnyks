'use strict';

const Cnyks     = require('./index');
const parseargs = require('nyks/process/parseArgs');
const read      = require('read');


const COLS = 96;

// args can shift pre-imposed design, like ['--ir://start=hi', '--ir://run=']
module.exports = function(module, module_name, args = []) {

  const cmdline        = process.argv.slice(2);

  if(args.length) {
    let i = args.pop(), v = cmdline.shift() || '';
    cmdline.unshift(...args, `${i}${v}`);
  }

  const cmdline_parsed = parseargs(cmdline);

  cmdline_parsed.dict['ir://name']   = module_name || module.name || "app";
  cmdline_parsed.dict['ir://stderr'] = process.stderr.write.bind(process.stderr);
  cmdline_parsed.dict['ir://stdout'] = process.stdout.write.bind(process.stdout);
  cmdline_parsed.dict['ir://prompt'] = read;

  cmdline_parsed.dict['ir://cols']   = Math.min(process.stdout.columns - 2, COLS);

  let cnyks = Cnyks.start(module, cmdline_parsed.dict, cmdline_parsed.args, function(err) {
    if(err) {
      setTimeout(() => {
        console.error(err, err && err.stack || '');
        throw "Failure in cnyks";
      });
    }
    if(process.stdin.unref)
      process.stdin.unref();
    process.emit('cnyksEnd');
  });

  process.stdout.on("resize", () => {
    cnyks.cols = Math.min(process.stdout.columns - 2, COLS);
  });

  return cmdline_parsed;
};
