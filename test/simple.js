var expect   = require("expect.js");
var path     = require('path');
var stream   = require('stream');
var cp       = require('child_process');
var startsWith = require('mout/string/startsWith');
var cnyks    = require('../lib');


var is_child = process.argv.indexOf("--child") != -1;


if(is_child) {
  cnyks.start(path.resolve(__dirname, "data/fuu.js"), {"ir://json": true});
  return;
}



describe("Testing simple class reflection", function(){
  this.timeout(5 * 1000);

  var child;
  before(function(){

    var args = ["node_modules/istanbul/lib/cli.js", "--preserve-comments", "cover", "--dir", "coverage/child", "--report", "none", "--print", "none", "test/simple.js", "--", "--child"];

    child = cp.spawn(process.execPath, args);
  });


  function waitprompt(chain){
    child.stdout.on("data", function(buf){
      if(startsWith("" + buf, "$fuu.js :")) {
        child.stdout.removeAllListeners("data");
        chain();
      }
    });
  }

  it("should wait for runner prompt", waitprompt);

  it("should prompt the cal in interactive loop", function(chain) {

    child.stdin.write("sum 1 2\n");
    child.stdout.once("data", function(buf){
      expect(Number("" + buf)).to.be(3);

      waitprompt(chain)
    });
  });

  it("should allow promises", function(chain) {

    child.stdin.write("introduce francois 30\n");
    child.stdout.once("data", function(buf){
      expect( "" + buf).to.be(JSON.stringify("Hi francois of 31"));

      waitprompt(chain)
    });
  });


  it("should go back to prompt on dummy line", function(chain) {
    child.stdin.write("\n");
    waitprompt(chain)
  });

  it("should not accept invalid command", function(chain) {
    child.stdin.write("invalid\n");

    var err = "";
    child.stderr.once("data", function(buf){ err += buf; });

    waitprompt(function(){
      child.stderr.removeAllListeners("data");
      expect(err.trim()).to.be("[Error: Invalid command key 'invalid']");
      chain();
    })
  });


  it("should allow proper help rendering", function(chain){
    child.stdin.write("?\n");
    var err = "";
    child.stderr.on("data", function(buf){ err += buf; });

    waitprompt(function(){
      child.stderr.removeAllListeners("data");

      var args = err.split("\n").map(function(line){
        return line.replace(/[╠═╣║╔╗╚╝]/g, "").trim();
      }).filter(function(a){ return !!a});
      expect(args).to.eql([ '`runner` commands list',
          'list_commands (?)',
          'replay (r)',
          'quit (q)',
          '`fuu.js` commands list',
          'sum (add, add1) $a, $b',
          'bar',
          'introduce $name, $age',
      ]);

      chain();
    })
  });

  it("should quit the runner", function(chain) {

    child.stdin.end("quit\n");
    child.on('exit', function(){
      chain();
    });

    child.stdout.on("data", function(buf){ console.log( ""+buf); });
    child.stderr.on("data", function(buf){ console.log( ""+buf); });
  });
    


});

