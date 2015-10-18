var expect   = require("expect.js");
var cnyks    = require('../lib');
var path     = require('path');
var stream   = require('stream');
var cp       = require('child_process');
var startsWith = require('mout/string/startsWith');


var is_child = process.argv.indexOf("--child") != -1;


if(is_child) {
  cnyks.start(path.resolve(__dirname, "data/fuu.js"), {"ir://json": true});
  return;
}



describe("Testing simple class reflection", function(){
  this.timeout(5 * 1000);

  var child;
  before(function(){

    var args = ["node_modules/istanbul/lib/cli.js", "cover", "--dir", "coverage/child", "--report", "none", "--print", "none", "test/simple.js", "--", "--child"];

    child = cp.spawn(process.execPath, args);
  });


  it("should wait for runner prompt", function(chain) {
    child.stdout.on("data", function(buf){
      if(startsWith("" + buf, "$fuu.js :")) {
        child.stdout.removeAllListeners("data");
        chain();
      }
    });
  });

  it("should prompt the cal in interactive loop", function(chain) {

    child.stdin.write("sum 1 2\n");
    child.stdout.once("data", function(buf){
      expect(Number("" + buf)).to.be(3);


      child.stdout.on("data", function(buf){
        if(startsWith("" + buf, "$fuu.js :")) {
          child.stdout.removeAllListeners("data");
          chain();
        }
      });

    });
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

