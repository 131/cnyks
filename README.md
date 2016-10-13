[cnyks](https://github.com/131/cnyks) is a CLI runner for nodejs modules. 


[![Build Status](https://travis-ci.org/131/cnyks.svg?branch=master)](https://travis-ci.org/131/cnyks)
[![Coverage Status](https://coveralls.io/repos/github/131/cnyks/badge.svg?branch=master)](https://coveralls.io/github/131/cnyks?branch=master)
[![NPM version](https://img.shields.io/npm/v/cnyks.svg)](https://www.npmjs.com/package/cnyks)



# Motivation
`cnyks` will look at your class/instance prototype and reflect the API it expose, hence, any module can be handled by cnyks.
There is **no API** to abide, compose your class the way you like.

# Async support / ES6 generators & async/await
Asynchronious APIs are supported  (internaly using [co](https://github.com/tj/co) ). Just declare a generator function in your class !


# Installation

```
npm install -g cnyks
```

# Usage
```
cnyks path/to/your/module.js
```

# ES6 classes & generator example
```
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
  static test(){
    console.log("Got test");
  }
}
```
Now, just cnyks' it !
```
cnyks foo.js
```





# Unattended usage flags / arguments

* `--ir://` is a "namespace" for all cnyks dedicated arguments
* `--ir://run=method_name` run  "method_name" on your module, then quit
* `--ir://start=method_name` run "method_name" on your module, then start the interactive loop
* `--ir://json` (to be used with "run")  silence ir helpers, format output as JSON
* `--ir://run=hello --name=bar` run method "hello" with argument `foo` set to 'bar' (i.e. `function hello(name) { }`)




# TODO
* Get rich or die tryin'

# Credits
* [131](https://github.com/131)
* Derived from [yks/clyks](https://github.com/131/yks/blob/master/class/exts/cli/interactive_runner.php)


# Buzzword / shoutbox / SEO LOVE
cli, reflection API, commander, cnyks, interactive runner, async/await, ES6 generators, co, async-co, promise, Promises, yield, "Let's have a beer & talk in Paris"


