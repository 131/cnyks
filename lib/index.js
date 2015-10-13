"use strict";


var path      = require('path');
var Class     = require('uclass');
var statik    = require('uclass/static');
var read      = require("read")


var parsefunc = require("../scan/parsefunc");

var forIn     = require("mout/object/forIn");
var values    = require("mout/object/values");
var once      = require("nyks/function/once");
var merge     = require("mout/object/merge");
var diff      = require("mout/array/difference");
var repeat    = require("mout/string/repeat");
var splitArgs = require('nyks/process/splitArgs');
var box       = require('nyks/cli/box');
var sprintf   = require('util').format;

var RUNNER_NS   = 'runner';
var OUTPUT_JSON = 'json';


var Cnyks = new Class({
  Binds : [],

  output : null,
  initialize : function(dict){

    if(dict['ir://json']) 
      this.output = OUTPUT_JSON;


    this.scan(this, RUNNER_NS);
  },


  commands_list :  {},


  completer : function (line) /**
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
  },


  help_cmd : function (command) /**
  * @interactive_runner hide
  */ {
    var str    = command['command_key'],
        aliases = Object.keys(command['aliases']);


    aliases  = diff(aliases, [command['command_key'], command['command_hash']]);

    if(aliases.length)
      str += " (" + aliases.join(', ') + ")";



    if(command['usage']['params']) {
      var tmp_trailing_optionnal = 0; var tmp_str = [];

      forIn(command['usage']['params'], function(param_infos, param_name) {
        tmp_str.push(( param_infos['optional'] ? '[' : '') + "$" + param_name);

        if( param_infos['optional'])
          tmp_trailing_optionnal ++;
      });
      str += " " + tmp_str.join(', ') + repeat("]", tmp_trailing_optionnal);
    }

    return str;
  },


  list_commands : function(chain) /**
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

    box.apply(null, rbx_msgs);


    chain();
  },



  replay : function() /**
  * @alias r
  */ {
    //this is only a placeholder
  },

  generate_command_hash : function(command_ns, command_key) /**
  * @interactive_runner hide
  */ {
    return sprintf("%s::%s", command_ns, command_key);
  },

  lookup : function(command_prompt) /**
  * @interactive_runner hide
  */ {
    var command_resolve = [];
    forIn(this.commands_list, function(command_infos, command_hash){
      if(command_prompt in command_infos['aliases'])
        command_resolve.push(command_infos);
    });

    if(command_resolve.length > 1)
      throw Error("Too many result for command %s, please specify ns", command_prompt);

    return command_resolve[0];
  },

  command_alias : function (command_ns, command_key, alias, args) /**
  * @interactive_runner hide
  */ {
    var command_hash = this.generate_command_hash(command_ns, command_key);
    if(!this.commands_list[command_hash])
      return false;

    this.commands_list[command_hash]['aliases'][alias] = args;
  },


  command_register : function(command_ns, command_key, callback, usage) /**
  * @interactive_runner hide
  */ {
    var command_hash = this.generate_command_hash(command_ns, command_key);
    this.commands_list[command_hash] = {
      'command_hash': command_hash,
      'command_ns'  : command_ns,
      'command_key' : command_key,
      'usage'       : usage,
      'callback'    : callback,
      'aliases'     : {},
    };

    this.command_alias(command_ns, command_key, command_key);
    this.command_alias(command_ns, command_key, command_hash);
  },


  command_parse : function(command_prompt, command_args, command_dict) /**
  * @interactive_runner hide
  */ {

    if(!command_prompt)
      return;

    var command_infos = this.lookup(command_prompt);

    if(!command_infos)
      throw new Error("Invalid command key '%s'", command_prompt);

    var alias_args  = command_infos['aliases'][command_prompt];
    if(alias_args)
        command_args  = command_args.concat(alias_args);

    var command_args_mask = command_infos['usage']['params'];
    var mandatory_arg_index  = 0, current_args = {}, mandatory_arg_len = Object.keys(command_args_mask).length;

    forIn(command_args_mask, function(param_infos, param_name) {
      var param_in;

      if(mandatory_arg_index == mandatory_arg_len - 1 && !command_infos['usage']['sync'])
        return;

      if(command_args[mandatory_arg_index] !== undefined) {
        param_in = command_args[mandatory_arg_index];
      } else if(command_dict && command_dict[param_name] !== undefined) {
        param_in = command_dict[param_name];
      } else {

        var opts = {
            prompt :  sprintf("$%s[%s] ", this.module_name, param_name)
        };
        read(opts, function(err, data_str){
          if(err)
            return;
          param_in = data_str;
        });

      }

      current_args[param_name] = param_in;
      mandatory_arg_index++;
    }, this);

    
    return merge({
      args     : current_args,
      argv     : values(current_args),
    }, command_infos);

  },

  quit : function() /**
  * @alias q
  */ {
    process.exit();
  },


  run : function(opts) /**
  * @interactive_runner hide
  */ {
    var self = this;
    var run = [], start = [];


    if(opts["ir://run"])
      run = [opts["ir://run"] === true ? "run" : opts["ir://run"]];
    if(opts["ir://start"])
      start = [opts["ir://start"]];


    var operations = [].concat(run, start);
    operations.forEach(function(cmd){


      var next = once(function(){

          var args = [].slice.apply(arguments);
          if(self.output == OUTPUT_JSON)
              process.stdout.write(JSON.stringify(args[0]));
          else box("Response", args);

          if(run.length)
            process.exit();
          self.command_loop();
      });

      var foo = self.command_parse(cmd, [], opts);
      var response = foo.callback.apply(null, foo.argv.concat(next));


      if(foo.usage.sync) process.nextTick(function(){
        next(response);
      });

    });
    if(!operations.length)
      this.command_loop();
  },



  command_loop : function() /**
  * @interactive_runner hide
  */ {

    var self = this, completer = self.completer.bind(this);
    
    function loop(){
      var opts = {
          prompt :  "$" + self.module_name + " :",
          completer : completer,
      };
      read(opts, function(err, data_str){
        if(err)
          return;


        var chain = once(loop),
            command_split = splitArgs(data_str),
            command_prompt = command_split.shift(),
            command;

        try {
          command = self.command_parse(command_prompt, command_split);
          if(!command)
            return chain();
        } catch(e){ console.log(e); return chain(); }

        if(!command)
          return chain();

        var response = command.callback.apply(null, command.argv.concat(function(){
          var args = [].slice.apply(arguments);
          if(args.length)
            box("Response", args);

          chain();
        }));

        if(response)
          box("Response", response);

        if(command.usage.sync)
          return chain();

      });
    }

    loop();

  },



  scan : function(obj, command_ns) /**
  * @interactive_runner hide
  */ {
   var self = this;
   var proto = Object.getPrototypeOf(obj);
   var argsSplitter = new RegExp("^function.*?\\((.*?)\\)\s+(/\\*.*?\\*/)?", "m");

    Object.keys(proto).forEach(function(method_name){
      if(typeof obj[method_name] != "function") return;
      if(method_name == "initialize") return;

      var command_key  = method_name,
          callback     = obj[method_name].bind(obj);

      var reflectedFunc = parsefunc(obj[method_name]), //function () { [native code] }
          doc = reflectedFunc.doc || {args : {}},
          ir = doc['args']['interactive_runner'];

      var params = reflectedFunc.params,
          tmp    =  ir ? ir['computed'] : [],
          sync   =  tmp.indexOf('sync') != - 1 || Object.keys(params).length < 1;

 

      var usage = {
        'doc'     : doc.doc,
        'params'  : params,
        'sync'    : sync,
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

  },



  start : statik( function(module_name, opts){
    var runner = new Cnyks(opts);

    runner.module_name = module_name;

    try {

      var module_path = path.resolve(module_name);
      require.resolve(module_path);

      var Module = require(module_path);
      var module = new Module();

      runner.scan(module, module_name);

    } catch (e){
      console.log(e);
      throw "Invalid module name";
    }

    if(runner.output != OUTPUT_JSON)
      runner.list_commands(Function.prototype);
    runner.run(opts); //private internal


  }),




});


module.exports = Cnyks;
