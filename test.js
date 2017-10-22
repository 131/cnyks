"use strict";

var sleep = require('nyks/async/sleep');

module.exports  = class {
  test(name) {
    console.log(name);

  }

  * hello(name) {
    yield sleep(1000);
    return Promise.resolve(name);
  }

  static testal(name, age) /**
* Do stuffs
* @param {string} name - Greet user
* @param {string} [age] - user age
*/{
    console.log("Got test", name);
  }
}
