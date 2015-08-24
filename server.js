var cluster = require('cluster');
var httpProxy = require('http-proxy');
var http = require('http');
var numCPUs = require('os').cpus().length;
var fs = require('fs');

if (process.argv.length < 3) {
  console.error('Usage: %s target-host', process.argv[1]);
  process.exit(1);
}
var target = process.argv[2];

http.globalAgent.maxSockets = 50;
var listen_port = 9000;

function logit() {
  return console.log.apply(console, ['[%s] ' + arguments[0], new Date().toISOString()].concat([].slice.call(arguments, 1)));
}

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; ++i) {
    cluster.fork();
  }
  cluster.on('exit', function(worker, code, signal) {
    logit('worker %d died', worker.process.pid);
    if (code != 10) {
      cluster.fork();
    }
  });
} else {
  // Workers can share any TCP connection
  // In this case its a HTTP server
  var agent = new http.Agent({ keepAlive: true });
  var detector = require('./lib/sqlchop');
  var rules = require('./lib/rules');

  rules.reload('header', logit);
  rules.reload('body', logit);
  rules.watch(logit);

  options = {
    agent: agent,
    interceptHeader: function(req) {
      var result = rules.testHeader(req);
      if (result) return result;
      var rs;
      if (req.url.length > 1) {
        rs = detector.classify(req.url, '', '');
        if (rs) {
          return {action: "DENY", target: "urlpath", rule: "sqlchop"}
        }
      }
      if (req.headers['cookie'] && req.headers['cookie'].length > 1) {
        rs = detector.classify('', req.headers['cookie'], '');
        if (rs) {
          return {action: "DENY", target: "cookie", rule: "sqlchop"}
        }
      }
      return {action: "PASS", target: "header"}
    },
    interceptBody: function(body) {
      var result = rules.testBody(body);
      if (result) return result;
      if (body && body.length > 1) {
        var rs = detector.classify('', '', body);
        if (rs) {
          return {action: "DENY", target: "body", rule: "sqlchop"};
        }
      }
      return {action: "PASS", target: "body"}
    },
    handleDENY: function(result, req, res, body) {
      if (result.target == "urlpath") {
        logit('[ %s %s by %s ] [%s] %s %s', result.action, result.target, result.rule, req.socket.remoteAddress, req.method, req.url);
      } else if (result.target == "body") {
        logit('[ %s %s by %s ] [%s] %s %s - body: %s', result.action, result.target, result.rule, req.socket.remoteAddress, req.method, req.url, body || '');
      } else {
        logit('[ %s %s by %s ] [%s] %s %s - %s: %s', result.action, result.target, result.rule, req.socket.remoteAddress, req.method, req.url, result.target, req.headers[result.target] || '');
      }
      res.writeHead(403, {'Content-Type': 'text/plain'});
      res.end('Access Denied.\r\n');
    },
    handleALLOW: function(result, req, res) {
      logit('[ %s ] [%s] %s %s', result.action, req.socket.remoteAddress, req.method, req.url);
    }
  }
  var proxy = httpProxy.createProxyServer(options);
  // http server
  var server = http.createServer(function(req, res) {
    proxy.web(req, res, { target: target }, function(e) {
      if (e.code != 'ECONNRESET') {
        logit(e);
      }
    });
  });
  server.on('error', function (e) {
    if (e.code == 'EADDRINUSE') {
      logit('ERROR address and port already in use, exit 10');
      process.exit(10);
    }
  });
  server.listen(listen_port);
  logit('server listening on', listen_port);
}
