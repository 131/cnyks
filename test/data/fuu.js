"use strict";

var sleep = require('nyks/function/sleep');
var Class = require('uclass');



var foo = new Class({


  initialize : function(){
    
  },


  //floating alias is without effect
  sum : function(a, b)/**
  * @interactive_runner sync
  * @alias
  * @alias add
  * @alias add1 1
  */ {

    return a + b;
  },


  dummy : function()
  /**
  * @interactive_runner hide
  */ {

  },

  bar : function   * (){
    yield sleep(1000); 
    return "ok";
  },

  introduce : function * (name, age){
    //this one return a promise
    return Promise.resolve(`Hi ${name} of ${age + 1}`);
  },



});


module.exports = foo;