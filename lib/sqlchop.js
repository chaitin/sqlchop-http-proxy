var cwd = process.cwd();
process.chdir(__dirname + '/sqlchop');
var fs = require('fs');
var protobuf = require('protocol-buffers');
var messages = protobuf(fs.readFileSync('sqlchopio.proto'));
var waf = require(__dirname + '/../build/Release/sqlchop.node')
process.chdir(cwd);

module.exports.classify = function(urlpath, cookie, body) {
    var r = {urlpath: urlpath, cookie: cookie, body: body}
    var proto = messages.Request.encode(r);
    return waf.classify(proto);
};
