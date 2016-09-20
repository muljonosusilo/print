var template = function(s, pre, post) {
  var m = [];
  var re = /\{\s?(\w*)\s?\}/g;
  var res = re.test(s);
  var r = res ? s.match(re).map(function(reg) {
    var p = reg.slice(1, -1);
    m[m.length] = new RegExp(reg, 'g');
    return p;
  }) : s;
  return res ? function t(d, f) {
    if (Array.isArray(d)) {
      return (pre || "") + d.map(t, s).join('') + (post || "");
    } else {
      return r.reduce(function(n, p, i, a) {
        if (p in d) {
          var o = d[p];
          if (typeof o != "object") {
            return n.replace(m[i], typeof f == "function" ? f(o) : o);
          } else {
            return n.replace(m[i], function() {
              return t(o, f);
            });
          }
        } else return n.replace(m[i], "");
      }, s);
    }
  } : function() { return r; };
};
if (typeof module != "undefined") {
  module.exports = template;
}
