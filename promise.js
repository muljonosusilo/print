var promise = function(context, method, filename, enc) {
  var args = Array.prototype.slice.call(arguments, 2);
  return new Promise(function(fulfill, reject) {
    require(context)[method].apply(null, args.concat(function(err, res) {
      if (err) reject(err);
      else fulfill(res);
    }));
  });
};
if (typeof module != "undefined") {
  module.exports = promise;
}