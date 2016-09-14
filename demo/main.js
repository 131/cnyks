var Terminal     = require('xterm2');

  require('xterm2/addons/fit')(Terminal); //addon


var $ = function(sel) { return  document.querySelector(sel) };


var Foo   = require('./foo');
var cnyks = require('../');


var term = new Terminal();
console.log({term})

createTerminal($('#terminal-container'));
term.on('data', function(data){
  console.log({data});

});

var runner = cnyks.start(Foo, {

  'ir://name'  : 'foo',
  'ir://prompt'  : function*( opts) {
      console.log("Prompting", {opts});
      term.write('\r\n$');

      return new Promise(function(resolve, reject){
        term.once("data", function(){
          console.log("DONNDONE");
        });
      });
   },

  'ir://stderr' : term.write.bind(term),
  'ir://stdout' : term.write.bind(term),
});



function createTerminal(terminalContainer) {

  term.open(terminalContainer);
    term.fit();

  var prompt = function () {
    term.write('\r\n$');
  };

  term.writeln('Welcome to xterm2');
  term.writeln('This is a local terminal emulation, without a real terminal in the back-end.');
  term.writeln('Type some keys and commands to play around.');
  term.writeln('');
  prompt();

  var line = "";
  term.on('key', function (key, ev) {
    var printable = (
      !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey
    );

    if (ev.keyCode == 13) {
      prompt();
    } else if (ev.keyCode == 8) {
     // Do not delete the prompt
      if (term.x > 2) {
        term.write('\b \b');
      }
    } else if (printable) {
      term.write(key);
    }
  });

  term.on('paste', function (data, ev) {
    term.write(data);
  });
}

