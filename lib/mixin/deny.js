/*! deny.js */

/**
 * This mixin specifies methods which are not allowed.
 *
 * @class deny
 * @mixin
 * @example
 * var MyKago = KagoDB.inherit();
 * var deny = KagoDB.bundle.deny;
 * MyKago.mixin(deny({write:-1}));
 *
 * var collection = MyKago();
 * collection.write(); // => 'Error: method denied: write'
 */

module.exports = function(methods, error) {
  var mixin = {};

  for (var method in methods) {
    mixin[method] = genfunc(method, methods[method]);
  }

  return mixin;

  function genfunc(method, col) {
    var err = error || new Error('method denied: ' + method);
    var func;
    col = parseInt(col, 10);
    if (col >= 0) {
      func = function() {
        var callback = arguments[col];
        if ('function' === typeof callback) {
          callback(err);
        } else {
          throw err;
        }
      };
    } else if (col < 0) {
      func = function() {
        var callback = arguments[arguments.length + col];
        if ('function' === typeof callback) {
          callback(err);
        } else {
          throw err;
        }
      };
    } else {
      func = function() {
        throw err;
      };
    }
    return func;
  }
};