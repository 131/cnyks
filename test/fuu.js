"use strict";

var Class = require('uclass');



var foo = new Class({



  initialize : function(){
    
  },

  foo : function(){
    return 42;

  },


  dummy : function()
  /**
  * @interactive_runner hide
  */ {

  },

  bar : function(chain){
    var b = function(){
      console.log('This is jambon');
    }
    chain(54);
  },


});

module.exports = foo;