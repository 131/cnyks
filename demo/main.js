"use strict";

const Terminal     = require('xterm2');

  require('xterm2/addons/fit')(Terminal);
  require('xterm2/addons/readline')(Terminal);


const Foo   = require('./foo');
const cnyks = require('../lib/');
const promisify = require('nyks/function/promisify');
const box = require('../lib/box');

const term = new Terminal();
  window.term = term; //usefull for debug
var $ = document.querySelector.bind(document);


$("#runner").addEventListener('click', function(){
  var module = {};
    Function("module", $("#klass").value).call(null, module);


  var runner = cnyks.start(module.exports, {
    'ir://name'  : 'foo',
    'ir://prompt' : promisify(term.readline, term),
    'ir://stderr' : term.write.bind(term),
    'ir://stdout' : term.write.bind(term),
  });

  box.COLS = term.cols - 1 ; //
  runner
});

createTerminal($('#terminal-container'));

window.onresize =  function() {
console.log("Resizing");
  term.fit();
  term.reset();

  runner.setCols(term.cols- 1);
  runner.run(); //previous run has been aborted by term.reset
}


function createTerminal(terminalContainer) {
  term.open(terminalContainer);
  term.fit();
}

