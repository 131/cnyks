"use strict";

const Terminal     = require('xterm2');

  require('xterm2/addons/fit')(Terminal);
  require('xterm2/addons/readline')(Terminal);

const Foo   = require('./foo');
const cnyks = require('../');
const promisify = require('nyks/function/promisify');

const term = new Terminal();
  window.term = term; //usefull for debug

createTerminal(document.querySelector('#terminal-container'));

function createTerminal(terminalContainer) {
  term.open(terminalContainer);
  term.fit();

  var runner = cnyks.start(Foo, {

    'ir://name'  : 'foo',
    'ir://prompt' : promisify(term.readline, term),
    'ir://stderr' : term.write.bind(term),
    'ir://stdout' : term.write.bind(term),
  });
}

