"use strict";

const sleep = require('nyks/async/sleep');
const boolPrompt = require("../../prompt/bool");


class dummyBottom {
  mirror(foo) {
    return foo;
  }

  bar() {

  }
}

class dummy  extends dummyBottom {
  bar(foo) {
    super.bar(foo);
    return foo;
  }
}

class foo extends dummy {


  //floating alias is without effect
  sum(a, b)/**
  * @alias
  * @alias add
  * @alias add1 1
  * @param {number} [b=2] - right value
  */ {

    return a + b;
  }

  size(...c) {
    return c.length;
  }

  dummy()
  /**
  * @interactive_runner hide
  */ {
  }


  failure() /**
  * this is just sad
  * yet it's necessary
  */ {
    throw "NICHT KEINE NEIN NEIN NEIN !";
  }


  async comfort() {
    var response = await boolPrompt("you happy ?", true);
    console.log(response ? "good for you!" : "too bad");
  }

  async binary() {
    return Buffer("café");
  }


  async whisper() {
    return [...arguments];
  }


  async introduce(name, age)/**
 * @param {string} [name=martin] - name to greet with
 * @param {number} [age=10] - age to greet with
 */{
    //this one return a promise
    await sleep(100);
    return Promise.resolve(`Hi ${name} of ${age + 1}`);
  }
}


module.exports = foo;
