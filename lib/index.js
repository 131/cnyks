"use strict";

const co         = require('co');

const eachSeries   = require('async-co/eachSeries');
const eachOfSeries = require('async-co/eachOfSeries');



const forIn      = require("mout/object/forIn");
const values     = require("mout/object/values");
const kindOf     = require('mout/lang/kindOf');
const merge      = require("mout/object/merge");
const diff       = require("mout/array/difference");
const startsWith = require("mout/string/startsWith");

const parsefunc  = require("reflection-js/parsefunc");
const splitArgs  = require('nyks/process/splitArgs');
const box        = require('nyks/cli/box');
const sprintf    = require('nyks/string/format');
const repeat     = require('nyks/string/repeat');


const RUNNER_NS   = 'runner';
const OUTPUT_JSON = 'json';


class Cnyks {

  constructor(dict) {
    if(!dict)
      dict = {};

    this.output = null;
    if(dict['ir://json']) 
      this.output = OUTPUT_JSON;

    this._stderr = dict["ir://stderr"] || Function.prototype;
    this._stdout = dict["ir://stdout"] || Function.prototype;
    this._prompt = dict["ir://prompt"] || Function.prototype;

    this.commands_list = {};
    this.module_name = dict["ir://name"];
    this.scan(this, RUNNER_NS);
  }


  completer(line) /**
  * Autocomplete helper
  * @interactive_runner hide
  */ {

    var completions = [];

    forIn(this.commands_list, function(command) {
        if(command['command_ns'] != RUNNER_NS)
          completions.push(command['command_key']);
    });

    var hits = completions.filter(function(c) { return c.indexOf(line) == 0 })
    // show all completions if none found
    return [hits.length ? hits : completions, line]
  }


  help_cmd(command) /**
  * @interactive_runner hide
  */ {
    var str    = command['command_key'],
        aliases = Object.keys(command['aliases']);


    aliases  = diff(aliases, [command['command_key'], command['command_hash']]);

    if(aliases.length)
      str += " (" + aliases.join(', ') + ")";

    if(Object.keys(command['usage']['params']).length) {
      var tmp_trailing_optionnal = 0; var tmp_str = [];

      forIn(command['usage']['params'], function(param_infos, param_name) {
        if(param_infos['optional'])
          tmp_trailing_optionnal++;
        tmp_str.push( ( param_infos['optional'] ? '[':'') + "$" + param_name);
      });

      str += " " + tmp_str.join(', ') + repeat("]", tmp_trailing_optionnal) ;
    }

    return str;
  }


  list_commands() /**
  * Display all available commands
  * @alias ?
  */ {

    var msgs = {}, rbx_msgs = [];


    forIn(this.commands_list, function(command, command_hash) {
      if(command['usage']['hide'])
        return;

      var str = this.help_cmd(command);

      if(!msgs[command['command_ns']])
        msgs[command['command_ns']] = [];

      msgs[command['command_ns']].push(str);

    }, this);

    forIn(msgs, function(msgs, command_ns) {
      rbx_msgs.push("`" + command_ns + "` commands list");
      rbx_msgs.push(msgs.join("\n"));
    });

    this._stderr(box.apply(null, rbx_msgs));
  }



  replay() /**
  * @alias r
  */ {
    //this is only a placeholder
  }

  generate_command_hash(command_ns, command_key) /**
  * @interactive_runner hide
  */ {
    return sprintf("%s:%s", command_ns, command_key);
  }

  lookup(command_prompt) /**
  * @interactive_runner hide
  */ {
    var command_resolve = [];
    forIn(this.commands_list, function(command_infos, command_hash){
      if(command_prompt in command_infos['aliases'])
        command_resolve.push(command_infos);
    });

    if(command_resolve.length > 1)
      throw Error(sprintf("Too many results for command '%s', call explicitly [ns]:[cmd]", command_prompt));

    return command_resolve[0];
  }

  command_alias(command_ns, command_key, alias, args) /**
  * @interactive_runner hide
  */ {
    var command_hash = this.generate_command_hash(command_ns, command_key);
    if(!this.commands_list[command_hash])
      return false;

    this.commands_list[command_hash]['aliases'][alias] = args;
  }


  command_register(command_ns, command_key, callback, usage) /**
  * @interactive_runner hide
  */ {
    var command_hash = this.generate_command_hash(command_ns, command_key);
    this.commands_list[command_hash] = {
      'command_hash': command_hash,
      'command_ns'  : command_ns,
      'command_key' : command_key,
      'usage'       : usage,
      'aliases'     : {},

      'apply'       : function* (argv) {
        var response, output   = callback.apply(null, argv);
        var k = kindOf(output);
        if(k == "Function" || k == "Promise" || k == "Generator")
          response = yield output;
        else
          response = output;

        return Promise.resolve(response);
      },
    };

    this.command_alias(command_ns, command_key, command_key);
    this.command_alias(command_ns, command_key, command_hash);
  }


  * command_parse(command_prompt, command_args, command_dict) /**
  * @interactive_runner hide
  */ {
    var self = this;

    if(!command_prompt)
      return;

    var command_infos = this.lookup(command_prompt);

    if(!command_infos)
      throw new Error(sprintf("Invalid command key '%s'", command_prompt));

    var alias_args  = command_infos['aliases'][command_prompt];
    if(alias_args)
        command_args  = command_args.concat(alias_args);

    var command_args_mask = command_infos['usage']['params'];

    var mandatory_arg_index  = 0, current_args = {}, mandatory_arg_len = Object.keys(command_args_mask).length;

    yield eachOfSeries(command_args_mask, function* (param_infos, param_name) {
      var param_in;

      if(command_args[mandatory_arg_index] !== undefined) {
        param_in = command_args[mandatory_arg_index];
      } else if(command_dict && command_dict[param_name] !== undefined) {
        param_in = command_dict[param_name];
      } else if(param_infos['value'] !== undefined) {
         param_in = param_infos['value'];
      } else {
        param_in = yield self._prompt({
          prompt :  sprintf("$%s[%s] ", self.module_name, param_name)
        });
      }

      if(typeof param_in === "string" && param_in !== "" && isFinite(param_in))
        param_in = parseFloat(param_in);

      current_args[param_name] = param_in;
      mandatory_arg_index++;
    });


    return Promise.resolve(merge({
      args     : current_args,
      argv     : values(current_args),
    }, command_infos));

  }

  quit() /**
  * @alias q
  */ {
    this._running = false;
  }

  * _run(opts) /**
  * @interactive_runner hide
  */ {
    var self = this;
    var run = [], start = [];

    if(opts["ir://run"])
      run = opts["ir://run"] === true ? "run" : opts["ir://run"];
    if(opts["ir://start"])
      start = opts["ir://start"];

    if(typeof run === "string")
      run = [run];

    if(typeof start === "string")
      start = [start];



    var operations = [].concat(run, start);

    yield eachSeries(operations, function* (cmd) {

      var foo = yield self.command_parse(cmd, [], opts);

      var response = yield foo.apply(foo.argv);
      if(response !== undefined) {
        if(self.output == OUTPUT_JSON)
            self._stdout(JSON.stringify(response));
        else self._stderr(box("Response", response));
      }
    });

    if(run.length)
      return;

    yield this.command_loop();
  }



  * command_loop() /**
  * @interactive_runner hide
  */ {

    var self = this; //!!

    this._running = true;

    var opts = {
        prompt    :  "$" + self.module_name + " :",
        completer : self.completer.bind(self),
    };

    var data_str, command_split, command_prompt, command;
    do {

      try {
        data_str = yield self._prompt(opts);
      } catch(e) {
        self._stderr(e + "\r\n");//very improbable
        break;
      }

      command_split = splitArgs(data_str);
      command_prompt = command_split.shift();

      try {
        command = yield self.command_parse(command_prompt, command_split);
      } catch(e) {
        self._stderr(e + "\r\n");
        command = null;
      }

      if(!command)
        continue;

      var response = yield command.apply(command.argv);
      if(response !== undefined) {
        if(self.output == OUTPUT_JSON)
          self._stdout(JSON.stringify(response));
        else  self._stderr(box("Response", response));
      }

    } while(this._running);

  }



  scan(obj, command_ns) /**
  * @interactive_runner hide
  */ {
   var self = this;
   var proto = typeof obj == "function" ? obj.prototype : Object.getPrototypeOf(obj);

      //merge instance member with instance prototype member

    var keys = Object.getOwnPropertyNames(proto).concat(Object.getOwnPropertyNames(obj));

    keys.forEach(function(method_name) {
      if(typeof obj[method_name] != "function") return;
      if(method_name == "initialize"
        || method_name == "constructor"
        || startsWith(method_name, "_") ) return;


      var command_key  = method_name,
          callback     = obj[method_name].bind(obj);

      var reflectedFunc = parsefunc(proto[method_name] || obj[method_name]),
          doc = reflectedFunc.doc || {args : {}},
          ir = doc['args']['interactive_runner'];

      var params = reflectedFunc.params,
          tmp    =  ir ? ir['computed'] : [];

 
      var usage = {
        'doc'     : doc.doc,
        'params'  : params,
        'hide'    : tmp.indexOf('hide') != -1,
      };



      self.command_register(command_ns, command_key, callback, usage);


      if(doc.args.alias)
        forIn(doc['args']['alias']['values'], function(args){
          var alias_name  = args.shift();
          if(!( alias_name && command_key)) return;

          self.command_alias(command_ns, command_key, alias_name, args);
        });
    });

  }



  static start(module, opts) {
    if(!opts)
      opts = {};

    var runner = new Cnyks(opts);

    if(typeof module == "function") {
      runner.scan(module, runner.module_name);
      module = new module();
    }


    runner.scan(module, runner.module_name);

    if(runner.output != OUTPUT_JSON)
      runner.list_commands();


    co(runner._run.bind(runner), opts).catch(function(err){
      console.log("Failure in cnyks", err);
    });

    return runner;
  }

}


module.exports = Cnyks;
