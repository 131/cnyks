"use strict";


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

    let prompt;  //might be undefined
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
    for(let [, command] of Object.entries(this.commands_list)) {
      if(command['command_ns'] == RUNNER_NS)
        continue;
      if(!command['usage']['hide'])
        completions.push(command['command_key']);
      for(let [alias] of Object.entries(command['aliases'])) {
        if([command['command_hash'], command['command_key']].indexOf(alias) == -1)
          completions.push(alias);
      }
    }

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

      for(let [param_name, param_infos] of Object.entries(command['usage']['params'])) {
        if(param_infos['optional'])
          tmp_trailing_optionnal++;
        tmp_str.push((param_infos['optional'] ? '[' : '') + "$" + param_name);
      }

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

    for(let [, command] of Object.entries(this.commands_list)) {

      if(!msgs[command['command_ns']])
        msgs[command['command_ns']] = [];

      var lines = this.help_cmd(command);

      msgs[command['command_ns']].push(...lines);
    }

    for(let [command_ns, msgss] of Object.entries(msgs)) {
      rbx_msgs.push(`\`${command_ns}\` commands list`);
      rbx_msgs.push(msgss.join("\n"));
    }

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
    for(let [, command_infos] of Object.entries(this.commands_list)) {
      if(command_prompt in command_infos['aliases'])
        command_resolve.push(command_infos);
    }

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

      'apply'        : function (argv) {
        return  callback.obj[callback.method_name].apply(callback.obj, argv);
      },
    };

    if(!usage.hide)
      this.command_alias(command_ns, command_key, command_key);

    this.command_alias(command_ns, command_key, command_hash);
  }


  async command_parse(command_prompt, command_args, command_dict) /**
  * @interactive_runner hide
  */ {

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

    for(let [param_name, param_infos] of Object.entries(command_args_mask)) {
      var param_in;

      if(command_args[mandatory_arg_index] !== undefined) {
        param_in = command_args[mandatory_arg_index];
      } else if(command_dict && command_dict[param_name] !== undefined) {
        param_in = command_dict[param_name];
      } else if(param_infos.optional) {
        param_in = param_infos['value'];
      } else {
        if(!this._prompt)
          throw `Missing parameter --${param_name}`;

        param_in = await this._prompt({
          prompt :  sprintf("$%s[%s] ", this.module_name, param_name)
        });
      }

      if(typeof param_in === "string" && param_in !== "" && isFinite(param_in))
        param_in = parseFloat(param_in);

      current_args[param_name] = param_in;
      mandatory_arg_index++;
    }

    for(let i = mandatory_arg_index; i < command_args.length; i++)
      current_args[`+${i}`] = command_args[i];

    return {
      ...command_infos,
      args     : current_args,
      argv     : Object.values(current_args),
    };

  }


  quit() /**
  * @alias q
  */ {
    this._running = false;
  }

  async _run(opts) /**
  * @interactive_runner hide
  */ {
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
      var foo = await this.command_parse(cmd, [], opts);

      var response = await foo.apply(foo.argv);
      if(response !== undefined) {
        if(this.output == OUTPUT_JSON)
          this._stdout(Buffer.isBuffer(response) ? response : JSON.stringify(response) + "\n");
        else this._stderr(this._box("Response", response));
      }
    }

    if(run.length || !this._prompt)
      return;

    await this.command_loop();
  }



  async command_loop() /**
  * @interactive_runner hide
  */ {


    this._running = true;

    var opts = {
      prompt    :  "$" + this.module_name + " : ",
      completer : this.completer.bind(this),
    };

    var data_str;
    var command_split;
    var command_prompt;
    var command;
    do {
      try {
        data_str = await this._prompt(opts);
      } catch(e) {
        this._stderr(e + "\r\n");//very improbable
        break;
      }

      command_split = splitArgs(data_str);
      command_prompt = command_split.shift();

      try {
        command = await this.command_parse(command_prompt, command_split);
      } catch(e) {
        this._stderr(e + "\r\n");
        command = null;
      }

      if(!command)
        continue;

      try {
        var response = await command.apply(command.argv);
        if(response !== undefined) {
          if(this.output == OUTPUT_JSON)
            this._stdout(Buffer.isBuffer(response) ? response : JSON.stringify(response) + "\n");
          else this._stderr(this._box("Response", response));
        }
      } catch(err) {
        var trace = rreplaces(err.stack || '(none)', { [process.cwd()] : '.' });
        this._stderr(this._box("!! Uncatched exception !!", "" + err, "Trace", trace));
      }


    } while(this._running);

  }



  scan(obj, command_ns) /**
  * @interactive_runner hide
  */ {
    var proto = typeof obj == "function" ? obj.prototype : Object.getPrototypeOf(obj);

    var level = obj, keys = [];

    while(level && level != Function.prototype && level != Object.prototype) {
      keys.push(...Object.getOwnPropertyNames(level));
      level = Object.getPrototypeOf(level);
    }

    for(let method_name of keys) {
      var section = command_ns;
      if(typeof obj[method_name] != "function")
        continue;

      if(method_name == "initialize"
        || method_name == "constructor"
        || startsWith(method_name, "_"))
        continue;


      var command_key  = method_name;
      var callback     = { obj, method_name};

      var {blocs, params, doc} = parsefunc(proto[method_name] || obj[method_name]);
      var ir = blocs['interactive_runner'];

      var tmp    =  ir ? ir['computed'] : [];

      if(blocs['section'])
        section =  blocs['section'].computed[0];

      var usage = {
        'doc'     : doc[0] || "",
        'params'  : params,
        'hide'    : tmp.indexOf('hide') != -1,
      };

      this.command_register(section, command_key, callback, usage);


      if(blocs.alias) {
        for(let args of blocs.alias['values']) {
          var alias_name  = args.shift();
          if(!(alias_name && command_key))
            continue;
          this.command_alias(command_ns, command_key, alias_name, args);
        }
      }
    }

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
      if(isConstructor(module) && isClass(module)) {
        runner.scan(module, runner.module_name); //static scan
        //new module(args...)
        if(!opts['ir://static'])
          module = new (Function.prototype.bind.apply(module, [null].concat(args)));
      } else {
        module = {[module.name || 'run'] : module};
      }
    }

    runner.scan(module, runner.module_name);

    if(runner.output != OUTPUT_JSON)
      runner.list_commands();

    runner._run(opts).then(function(body) {  chain(null, body); }, chain);

    return runner;
  }

}

function isConstructor(obj) {
  return typeof obj === "function" && !!obj.prototype && (obj.prototype.constructor === obj);
}

function isClass(v) {
  return typeof v === 'function' && /^\s*class(?:\s+|{)/.test(v.toString());
}

module.exports = Cnyks;
