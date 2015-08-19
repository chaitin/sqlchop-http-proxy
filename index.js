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

var detector = require('./lib/sqlchop');

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
  options = {
    agent: agent,
    interceptHeader: function(req) { return detector.classify(req.url, req.headers['cookie'] || '', ''); },
    interceptData: function(req, data) { return (detector.classify('', '', data)); },
    interceptBan: function(req, res, data) {
      logit('[SQLi] [%s] %s %s', req.socket.remoteAddress, req.method, req.url);
      res.writeHead(403, {'Content-Type': 'text/plain'});
      res.end('Access Denied.\r\n');
    },
    interceptPass: function(req, res, data) {
      logit('[PASS] [%s] %s %s', req.socket.remoteAddress, req.method, req.url);
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
