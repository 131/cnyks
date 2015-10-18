cnyks is a command line interactive runner for nodejs. 

# Motivation
There is no api to implement for your module for it to be handled by cnyks. It goes the other way. Reflection API is build on esprima.

# Installation

```
npm install -g cnyks
```

# Usage
```
cnyks path/to/your/module.js
```

# Basic example
```
# this is a .... very basic node module
function foo(){}
foo.prototype = {
  bar : function(){
    console.log("Hello world");
  },
  siri_v2 : function(name, chain){
    chain("Hi ! " + name + ", have a nice day ! ");
  },
};
module.exports = foo;
```
Now, just cnyks' it !
```
cnyks foo.js
```




# Unattended usage flags

* --ir:// is a "namespace" for all cnyks dedicated arguments
* `--ir://run=method_name` run  "method_name" on your module, then quit
* `--ir://start=method_name` run "method_name" on your module, then start the interactive loop
* `--ir://json` (to be used with "run")  silence ir helpers, format output as JSON





# Todo / directions
* Use esprima ES6 classes processing.
