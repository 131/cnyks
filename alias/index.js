"use strict";


var alias = function(alias, cb){
  if(!cb.$nyks_alias)
   cb.$nyks_alias = [];
  
  cb.$nyks_alias.push(alias);
  return cb;
}


module.exports = alias;