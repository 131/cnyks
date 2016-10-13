"use strict";

var sleep = require('nyks/function/sleep');

module.exports  = class {
  test(name) {
    console.log(name);

  }

  * hello(name) {
    yield sleep(1000);
    return Promise.resolve(name);
  }
  static testal(){
    console.log("Got test");
  }
}
