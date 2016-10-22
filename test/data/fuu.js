"use strict";

var sleep = require('nyks/function/sleep');
var boolPrompt = require("../../prompt/bool");
var Class = require('uclass');





var foo = new Class({


  initialize : function(){
    
  },


  //floating alias is without effect
  sum : function(a, b)/**
  * @alias
  * @alias add
  * @alias add1 1
  * @param {number} [b=2] - right value
  */ {

    return a + b;
  },


  dummy : function()
  /**
  * @interactive_runner hide
  */ {
  },


  comfort : function   * () {
    var response = yield boolPrompt("you happy ?", true);
    console.log(response ? "good for you!" : "too bad");
  },


  introduce : function * (name, age)/**
 * @param {string} [name=martin] - name to greet with
 * @param {number} [age=10] - age to greet with
 */{
    //this one return a promise
    return Promise.resolve(`Hi ${name} of ${age + 1}`);
  },



});


module.exports = foo;