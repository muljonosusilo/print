"use strict";
var host = '172.17.0.1';
var bar = 'http://' + host + ':3030/?bcid=qrcode&scale=2&text=';
var blank = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAFNSURBVHhe7dIxAQAgDMCwgX/PwIGLNE8NdJ1nwtq/QTUArgFwDYBrAFwD4BoA1wC4BsA1AK4BcA2AawBcA+AaANcAuAbANQCuAXANgGsAXAPgGgDXALgGwDUArgFwDYBrAFwD4BoA1wC4BsA1AK4BcA2AawBcA+AaANcAuAbANQCuAXANgGsAXAPgGgDXALgGwDUArgFwDYBrAFwD4BoA1wC4BsA1AK4BcA2AawBcA+AaANcAuAbANQCuAXANgGsAXAPgGgDXALgGwDUArgFwDYBrAFwD4BoA1wC4BsA1AK4BcA2AawBcA+AaANcAuAbANQCuAXANgGsAXAPgGgDXALgGwDUArgFwDYBrAFwD4BoA1wC4BsA1AK4BcA2AawBcA+AaANcAuAbANQCuAXANgGsAXAPgGgDXALgGwDUArgFwDYBrAFwD4BqANnMBd/sE/JL3o8kAAAAASUVORK5CYII=';
var msg = {
  "operation-attributes-tag": {
    "requesting-user-name": "Muljono",
    "job-name": "My Test Job",
    "document-format": "application/pdf"
  }
};
var dir = '/var/www/html/print';
process.chdir(dir);
var toUpperCase = new Function('e', 'this[e]=this[e].toUpperCase();');
var printer = require('ipp').Printer('http://' + host + ':631/printers/HP-LaserJet-Professional-P1102');
var print = function (cmd, msg) {
  return function (fun) {
    printer.execute("Print-Job", msg, fun);
  };
};
var thunk = function (context, method) {
  var args = Array.prototype.slice.call(arguments, 2);
  return function (fun) {
    require(context)[ method ].apply(null, args.concat(fun));
  };
};
var get = function (url) {
  return function (fun) {
    require('http').get(url, function (res) {
      var arr = [];
      res.on('data', function (buf) {
        arr.push(buf);
      });
      res.on('end', function () {
        fun(null, Buffer.concat(arr));
      });
    });
  };
};
var sleep = function (ms) {
  return function (fun) {
    setTimeout(fun, ms);
  };
};
var phantom = require('phantom');
var render = function (url, file) {
  return function (fun) {
    phantom.create(function (ph) {
      ph.createPage(function (page) {
        page.settings = {
          localToRemoteUrlAccessEnabled: true
        };
        page.paperSize = {
          width: '8.5in',
          height: '11in'
        };
        page.open(url, function () {
          page.render(file);
          ph.exit();
          fun(null, "done");
        });
      });
    });
  };
};
var tpl;
thunk('fs', 'readFile', process.cwd() + '/print.html')(function (err, buf) {
  tpl = require('./template')(buf.toString());
});
var url = require('url');
var querystring = require('querystring');
var app = require('koa')();
app.use(function *(next) {
  if ( 'GET' != this.method )
    return yield next;
  var rnd = Date.now();
  var path = url.parse(this.url);
  var obj = path.search ? querystring.parse(path.search.slice(1)) : {};
  var res = obj.media;
  Object.keys(obj).forEach(toUpperCase, obj);
  obj.media = res;
  obj.base64 = obj.code ? (yield get(bar + obj.code)).toString('base64') : blank;
  obj.netto = (obj.netto.length <= 5 ? '&nbsp;' : '') + obj.netto;
  console.log(tpl(obj));
  res = yield thunk('fs', 'writeFile', process.cwd() + '/f' + rnd + '.html', new Buffer(tpl(obj)));
  yield sleep(1000);
  console.log('write');
  res = yield render('http://' + host + '/print/f' + rnd + '.html', 'f' + rnd + '.pdf');
  yield sleep(1000);
  console.log(res);
  res = yield thunk('fs', 'unlink', process.cwd() + '/f' + rnd + '.html');
  console.log('delete');
  res = yield sleep(2000);
  msg.data = yield thunk('fs', 'readFile', process.cwd() + '/f' + rnd + '.pdf');
  console.log('read');
  yield sleep(1000);
  res = yield thunk('fs', 'unlink', process.cwd() + '/f' + rnd + '.pdf');
  
  console.log('delete 2');
  this.set('Access-Control-Allow-Origin', '*');
  this.body = JSON.stringify(yield print("Print-Job", msg));
});
var server = app.listen(4446, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('listening at http://[%s]:%s', host, port);
});
