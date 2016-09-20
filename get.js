module.exports = function (url, fun) {
  require('http').get(url, function (res) {
    var arr = [];
    res.on('data', function (buf) {
      arr.push(buf);
    });
    res.on('end', function () {
      fun(Buffer.concat(arr).toString('base64'));
    });
  });
};
