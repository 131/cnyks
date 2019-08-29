"use strict";

const co         = require('co');


const forIn      = require('mout/object/forIn');
const values     = require('mout/object/values');
const kindOf     = require('mout/lang/kindOf');
const merge      = require('mout/object/merge');
const diff       = require('mout/array/difference');
const startsWith = require('mout/string/startsWith');

const parsefunc  = require('reflection-js/parsefunc');
const splitArgs  = require('nyks/process/splitArgs');
const sprintf    = require('nyks/string/format');
const repeat     = require('nyks/string/repeat');
const rreplaces  = require('nyks/string/rreplaces');
const box        = require('./box');
const readline  = require('../pty/readline');


const RUNNER_NS   = 'runner';
const OUTPUT_JSON = 'json';


class Cnyks {

  constructor(dict, name) {
    if(!dict)
      dict = {};

    this.output = null;
    if(dict['ir://json'] || dict['ir://raw'])
      this.output = OUTPUT_JSON;

    let prompt = Function.prototype;
    let output = Function.prototype;
    let trace  = Function.prototype;
    let cols = 76;

    if(dict["ir://stream"]) {
      let stream = dict["ir://stream"];
      output = stream.write.bind(stream);
      trace = stream.stderr.write.bind(stream.stderr);
      prompt = readline.bind({stdin : stream, stderr : stream.stderr});

      stream.on("resize", () => {
        this.cols = Math.min(stream.columns - 2, 76);
      });
      cols = Math.min(stream.columns - 2, cols);
    }

    this._prompt = dict["ir://prompt"] || prompt;
    this._stdout = dict["ir://stdout"] || output;
    this._stderr = dict["ir://stderr"] || trace;
    this.cols    = dict["ir://cols"]   || cols;



    this.commands_list = {};
    this.module_name = dict["ir://name"] || name;
    this.scan(this, RUNNER_NS);
    this._box = (...blocs) => {
      return box({cols : this.cols}, ...blocs);
    };
  }


  completer(line) /**
  * Autocomplete helper
  * @interactive_runner hide
  */ {

    var completions = [];
    forIn(this.commands_list, function(command) {
      if(command['command_ns'] == RUNNER_NS)
        return;
      if(!command['usage']['hide'])
        completions.push(command['command_key']);
      forIn(command['aliases'], function(entry, alias) {
        if([command['command_hash'], command['command_key']].indexOf(alias) == -1)
          completions.push(alias);
      });
    });

    var hits = completions.filter(function(c) { return c.indexOf(line) == 0; });
    // show all completions if none found
    let results = [hits.length ? hits : (line ? [] : completions), line];

    return results;
  }


  help_cmd(command) /**
  * @interactive_runner hide
  */ {
    var str    = command['command_key'];
    var aliases = Object.keys(command['aliases']).filter(entry => !command['aliases'][entry].length);

    aliases  = diff(aliases, [command['command_key'], command['command_hash']]);

    if(aliases.length)
      str += " (" + aliases.join(', ') + ")";

    if(Object.keys(command['usage']['params']).length) {
      var tmp_trailing_optionnal = 0; var tmp_str = [];

      forIn(command['usage']['params'], function(param_infos, param_name) {
        if(param_infos['optional'])
          tmp_trailing_optionnal++;
        tmp_str.push((param_infos['optional'] ? '[' : '') + "$" + param_name);
      });

      str += " " + tmp_str.join(', ') + repeat("]", tmp_trailing_optionnal);
    }

    let lines = [];

    let doc = command['usage']['doc'];
    if(doc)
      str = str + repeat(" ", Math.max(1, this.cols - str.length - doc.length - 2)) + doc;

    if(!command['usage']['hide'])
      lines.push(str);

    for(let entry of Object.keys(command['aliases'])) {
      let aliases = command['aliases'][entry];
      if(aliases.length)
        lines.push(`${entry} (=${command['command_key']} ${aliases.join(' ')}) `);
    }

    return lines;
  }


  list_commands() /**
  * Display all available commands
  * @alias ?
  */ {

    var msgs = {};
    var rbx_msgs = [];

    forIn(this.commands_list, function(command /*, command_hash*/) {


      if(!msgs[command['command_ns']])
        msgs[command['command_ns']] = [];

      var lines = this.help_cmd(command);

      msgs[command['command_ns']].push(...lines);
    }, this);

    forIn(msgs, function(msgs, command_ns) {
      rbx_msgs.push("`" + command_ns + "` commands list");
      rbx_msgs.push(msgs.join("\n"));
    });

    this._stderr(this._box(...rbx_msgs));
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
    forIn(this.commands_list, function(command_infos/*, command_hash*/) {
      if(command_prompt in command_infos['aliases'])
        command_resolve.push(command_infos);
    });

    if(command_resolve.length > 1)
      throw Error(sprintf("Too many results for command '%s', call explicitly [ns]:[cmd]", command_prompt));

    return command_resolve[0];
  }

  command_alias(command_ns, command_key, alias, args = []) /**
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
      'command_hash' : command_hash,
      'command_ns'   : command_ns,
      'command_key'  : command_key,
      'usage'        : usage,
      'aliases'      : {},

      'apply'        : function* (argv) {
        var response;
        var output   = callback.obj[callback.method_name].apply(callback.obj, argv);
        var k = kindOf(output);
        if(k == "Function" || k == "Promise" || k == "Generator")
          response = yield output;
        else
          response = output;

        return Promise.resolve(response);
      },
    };

    if(!usage.hide)
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
      command_args  = alias_args.concat(command_args);

    var command_args_mask = command_infos['usage']['params'];

    var mandatory_arg_index  = 0;
    var current_args = {};
    //var mandatory_arg_len = Object.keys(command_args_mask).length;

    for(var param_name in command_args_mask) {
      var param_in;
      var param_infos = command_args_mask[param_name];

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
    }


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
    var run = [];
    var start = [];

    if(opts["ir://run"])
      run = opts["ir://run"] === true ? "run" : opts["ir://run"];
    if(opts["ir://start"])
      start = opts["ir://start"] === true ? "start" : opts["ir://start"];

    if(typeof run === "string")
      run = [run];

    if(typeof start === "string")
      start = [start];

    var operations = [].concat(start, run);

    for(var cmd of operations) {
      var foo = yield self.command_parse(cmd, [], opts);

      var response = yield foo.apply(foo.argv);
      if(response !== undefined) {
        if(self.output == OUTPUT_JSON)
          self._stdout(Buffer.isBuffer(response) ? response : JSON.stringify(response) + "\n");
        else self._stderr(self._box("Response", response));
      }
    }

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
      prompt    :  "$" + self.module_name + " : ",
      completer : self.completer.bind(self),
    };

    var data_str;
    var command_split;
    var command_prompt;
    var command;
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

      try {
        var response = yield command.apply(command.argv);
        if(response !== undefined) {
          if(self.output == OUTPUT_JSON)
            self._stdout(Buffer.isBuffer(response) ? response : JSON.stringify(response) + "\n");
          else self._stderr(self._box("Response", response));
        }
      } catch(err) {
        var trace = rreplaces(err.stack || '(none)', { [process.cwd()] : '.' });
        self._stderr(self._box("!! Uncatched exception !!", "" + err, "Trace", trace));

      }


    } while(this._running);

  }



  scan(obj, command_ns) /**
  * @interactive_runner hide
  */ {
    var self = this;
    var proto = typeof obj == "function" ? obj.prototype : Object.getPrototypeOf(obj);

    //merge instance member with instance prototype member

    var stack = [proto];
    var level = obj;

    while(level && level != Function.prototype && level != Object.prototype) {
      stack.push(level);
      level = Object.getPrototypeOf(level);
    }

    var keys = [];
    stack.forEach(level => keys.push.apply(keys, Object.getOwnPropertyNames(level)));


    keys.forEach(function(method_name) {
      var section = command_ns;
      if(typeof obj[method_name] != "function") return;

      if(method_name == "initialize"
        || method_name == "constructor"
        || startsWith(method_name, "_"))
        return;


      var command_key  = method_name;
      var callback     = { obj, method_name};

      var reflectedFunc;
      try {
        reflectedFunc = parsefunc(proto[method_name] || obj[method_name]);
      } catch(err) { return; } //skip invalid signatures

      var doc = reflectedFunc.doc || {args : {}};
      var ir = doc['args']['interactive_runner'];

      var params = reflectedFunc.params;
      var tmp    =  ir ? ir['computed'] : [];

      if(doc['args']['section'])
        section =  doc['args']['section'].computed[0];

      var usage = {
        'doc'     : doc.doc && doc.doc.length && (doc.doc[0] + "").trim(),
        'params'  : params,
        'hide'    : tmp.indexOf('hide') != -1,
      };

      self.command_register(section, command_key, callback, usage);


      if(doc.args.alias) {
        forIn(doc['args']['alias']['values'], function(args) {
          var alias_name  = args.shift();
          if(!(alias_name && command_key))
            return;
          self.command_alias(command_ns, command_key, alias_name, args);
        });
      }
    });

  }



  static start(module, opts, args, chain) {
    if(!opts)
      opts = {};
    if(!args)
      args = [];
    if(!chain)
      chain = Function.prototype;

    var runner = new Cnyks(opts, module.name || module.constructor && module.constructor.name);

    if(typeof module == "function") {
      runner.scan(module, runner.module_name); //static scan
      //new module(args...)
      module = new (Function.prototype.bind.apply(module, [null].concat(args)));
    }

    runner.scan(module, runner.module_name);

    if(runner.output != OUTPUT_JSON)
      runner.list_commands();

    co(runner._run.bind(runner), opts).then(function(body) {
      chain(null, body);
    }, chain);

    return runner;
  }

}

module.exports = Cnyks;
