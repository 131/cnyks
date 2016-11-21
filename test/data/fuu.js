"use strict";

const sleep = require('nyks/function/sleep');
const boolPrompt = require("../../prompt/bool");


class foo {


  //floating alias is without effect
  sum(a, b)/**
  * @alias
  * @alias add
  * @alias add1 1
  * @param {number} [b=2] - right value
  */ {

    return a + b;
  }


  dummy()
  /**
  * @interactive_runner hide
  */ {
  }


  failure () {
    throw "NICHT KEINE NEIN NEIN NEIN !";
  }


  * comfort() {
    var response = yield boolPrompt("you happy ?", true);
    console.log(response ? "good for you!" : "too bad");
  }


  * introduce(name, age)/**
 * @param {string} [name=martin] - name to greet with
 * @param {number} [age=10] - age to greet with
 */{
    //this one return a promise
    return Promise.resolve(`Hi ${name} of ${age + 1}`);
  }



}


module.exports = foo;