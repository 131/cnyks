[cnyks](https://github.com/131/cnyks) is a CLI runner for nodejs modules.

Aka : cnyks any ES6 class and :boom:*boom*:sparkles: you got the greatest command line runner ever (no fingerprint **at all**)

[![Build Status](https://travis-ci.org/131/cnyks.svg?branch=master)](https://travis-ci.org/131/cnyks)
[![Coverage Status](https://coveralls.io/repos/github/131/cnyks/badge.svg?branch=master)](https://coveralls.io/github/131/cnyks?branch=master)
[![NPM version](https://img.shields.io/npm/v/cnyks.svg)](https://www.npmjs.com/package/cnyks)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](http://opensource.org/licenses/MIT)


![demo workflow](/demo/cnyks.gif)

# Motivation
`cnyks` will analyze your class/instance **prototype** and **reflect** the API it exposes, hence, any module can be handled by cnyks. There is **no API** to abide, compose your class the way you like.


# Example
```
"use strict";

var sleep = require('nyks/async/sleep');

module.exports  = class {
  test(name) {
    console.log(name);
  }

  async hello(name) {
    await sleep(1000);
    return `Hello ${name}`;
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

# Installation/Usage

## CLI
```
npm install -g cnyks
cnyks path/to/your/module.js
# enjoy !
```
## CLI unattended flags / arguments

* `--ir://` is a "namespace" for all cnyks dedicated arguments
* `--ir://run=method_name` run  "method_name" on your module, then quit
* `--ir://start=method_name` run "method_name" on your module, then start the interactive loop
* `--ir://json` (to be used with "run")  silence ir helpers, format output as JSON
* `--ir://run=hello --name=bar` run method "hello" with argument `foo` set to 'bar' (i.e. `function hello(name) { }`)


## Self running, standalone cnyks bundle (via browserify)
Cnyks expose a **cnyksify** plugin for [browserify](https://github.com/substack/node-browserify).

```
browserify --node entry.js --plugin cnyks/ify  > bundle.js
```
- `node bundle.js` => start runner

## Standalone bootstrap
Just add this 2 lines footer to your module/class so it can be use by clyks directly
```
  //at the end of your module
module.exports = SomeClass;

if(module.parent === null) //ensure module is called directly, i.e. not required
  require('cnyks')(SomeClass); //start runner
```
Now just `node someapp.js` to start cnyks runner.


## Legacy ES5 async support
Cnyks also allows you to declare async function through generators (internaly using [co](https://github.com/tj/co) ).


# Bundled utilities
* `require('cnyks/ify')`  : a browserify plugin
* `require('cnyks/prompt/bool')(prompt, default)` : prompt (using [read]) for a boolean



# TODO
* Get rich or die tryin'

# Credits / related
* [131](https://github.com/131)
* Derived from [yks/clyks](https://github.com/131/yks/blob/master/class/exts/cli/interactive_runner.php)
* [co](https://github.com/tj/co), coroutine goddess, made cnyks possible
* [nyks](https://github.com/131/nyks), javascript toolkit, good complementarity


# Buzzword / shoutbox / SEO LOVE
cli, reflection API, commander, cnyks, interactive runner, async/await, co, promise, Promises, yield, "Let's have a beer & talk in Paris"

