/*! memory.js */

/**
 * This mixin implements a volatile
 * [storage]{@linkcode storage}
 * feature which stores items on memory.
 * Use namespace to share the storage across KagoDB instances in the same process.
 *
 * @class memory
 * @mixin
 * @example
 * var opts = {
 *   storage: 'memory',
 *   namespace: 'myspace'
 * };
 *
 * var collection = new KagoDB(opts);
 *
 * collection.read('foo', function(err, item){
 *   console.log(item);
 * });
 */

module.exports = function() {
  var mixin = {};
  mixin.read = read;
  mixin.write = write;
  mixin.erase = erase;
  mixin.exist = exist;
  mixin.index = index;
  mixin.memory_store = memory_store;
  return mixin;
};

function read(id, callback) {
  callback = callback || NOP;
  var store = this._memory_store || (this._memory_store = this.memory_store());
  id = this.escape(id);
  if (store.hasOwnProperty(id) && this.decode) {
    var item = store[id];
    this.decode(item, callback);
  } else {
    var err = new Error('Item not found');
    callback(err, null);
  }
}

function write(id, item, callback) {
  callback = callback || NOP;
  var store = this._memory_store || (this._memory_store = this.memory_store());
  id = this.escape(id);
  this.encode(item, function(err, item) {
    if (!err) {
      store[id] = item;
    }
    callback(err);
  });
}

function erase(id, callback) {
  callback = callback || NOP;
  var store = this._memory_store || (this._memory_store = this.memory_store());
  id = this.escape(id);
  if (store.hasOwnProperty(id)) {
    delete store[id];
    callback();
  } else {
    var err = new Error('Item not found');
    callback(err);
  }
}

function exist(id, callback) {
  callback = callback || NOP;
  var store = this._memory_store || (this._memory_store = this.memory_store());
  id = this.escape(id);
  var exists = store.hasOwnProperty(id);
  callback(null, exists);
}

function index(callback) {
  callback = callback || NOP;
  var store = this._memory_store || (this._memory_store = this.memory_store());
  var list = Object.keys(store);
  var unescape = this.unescape.bind(this);
  list = list.map(unescape);
  list = list.filter(function(id) {
    return !(id instanceof Error);
  });
  callback(null, list);
}

var SharedStore = {};

function memory_store() {
  var ns = this.get('namespace');
  var object;
  if (ns) {
    // memory shared in a process
    object = SharedStore[ns] || (SharedStore[ns] = {});
  } else {
    // volatile memory available only in a instance
    object = {};
  }
  return object;
}

function NOP() {}
