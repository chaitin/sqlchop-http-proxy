var fs = require('fs');
var path = require('path');
var filewatcher = require('filewatcher');

// init to empty array to allow bad rule from beginning
var rules = {
    header: [],
    body: []
}

function reload(what, callback) {
  try {
    var newrule = JSON.parse(fs.readFileSync(__dirname + "/rules/" + what + "_rules.json", "utf8"));
    if (!Array.isArray(newrule)) {
        callback("[ WARN ] %s rules is not an array", what);
        return;
    }
    for (var i = 0, l = newrule.length; i < l; i++) {
      newrule[i].pattern = new RegExp(newrule[i].pattern);
    }
    rules[what] = newrule;
    if (callback) {
      callback("[ INFO ] %d %s rules loaded", rules[what].length, what);
    }
  } catch (ex) {
    if (callback) {
      callback("[ WARN ] load %s rules failed: %s", what, ex);
    }
  }
}

module.exports.reload = reload;

module.exports.testHeader = function(req) {
  for (var i = 0, l = rules.header.length; i < l; i++) {
    var pattern = rules.header[i].pattern;
    var target = rules.header[i].target;
    var action = rules.header[i].action;
    var result = null;
    if (action == "ALLOW") {
      var target_ary = target.split('&');
      result = true;
      for (var j = 0; j < target_ary.length; j++) {
        if (target_ary[j] == "urlpath") {
          result = pattern.test(req.url);
        } else {
          result = pattern.test(req.headers[target_ary[j]]);
        }
        if (!result) {
          break;
        }
      }
      if (result) {
        return {"action": action.toUpperCase(), "target": "header", "rule": rules.header[i].id};
      }
    } else if (action == "DENY") {
      var target_ary = target.split('|');
      for (var j = 0; j < target_ary.length; j++) {
        if (target_ary[j] == "urlpath") {
          result = pattern.test(req.url);
        } else {
          result = pattern.test(req.headers[target_ary[j]]);
        }
        if (result) {
          return {"action": action.toUpperCase(), "target": target_ary[j], "rule": rules.header[i].id};
        }
      }
    }
  }
  return null;
};

module.exports.testBody = function(body) {
  for (var i = 0, l = rules.body.length; i < l; i++) {
    var pattern = rules.body[i].pattern;
    var target = rules.body[i].target;
    var action = rules.body[i].action;
    if (pattern.test(body)) {
      return {"action": action.toUpperCase(), "target": "body", "rule": rules.body[i].id};
    }
  }
  return null;
};

module.exports.watch = function(callback) {
  var watcher = filewatcher();
  watcher.add(__dirname + '/rules/header_rules.json');
  watcher.add(__dirname + '/rules/body_rules.json');
  watcher.on('change', function(file, stat) {
    if (file.indexOf('header') > -1) {
      reload('header', callback);
    } else if (file.indexOf('body') > -1) {
      reload('body', callback);
    } else {
      callback("[ WARN ] don't know what to load: %s", file);
    }
  });
}

