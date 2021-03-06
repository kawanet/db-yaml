/*! cursor.js */

var utils = require('./utils');

module.exports = Cursor;

function Proto() {}

/**
 * This returns the next object at the cursor.
 *
 * @method Cursor.prototype.nextObject
 * @param {Function} callback - function(err, item) {}
 * @returns {Cursor} instance itself for method chaining
 * @example
 * var cursor = collection.find();
 * cursor.nextObject(function(err, item){
 *   console.log(item);
 * });
 */

Proto.prototype.nextObject = function(callback) {
  if (!this.source) throw new Error('no source');
  this.source.nextObject(callback);
};

/**
 * This resets the cursor position to the original state.
 *
 * @method Cursor.prototype.rewind
 * @returns {Cursor} instance itself for method chaining
 * @example
 * var cursor = collection.find();
 * cursor.nextObject(function(err, item){
 *   console.log(item); // first item
 *   cursor.rewind();
 *   cursor.nextObject(function(err, item){
 *     console.log(item); // first item again
 *   });
 * });
 */

Proto.prototype.rewind = function() {
  if (!this.source) throw new Error('no source');
  if (this.source.rewind) this.source.rewind();
  return this;
};

/**
 * This is a Cursor instance constructor. find() and other some methods use this internally.
 *
 * @class Cursor
 * @param {KagoDB} collection - source collection
 * @param {Object|Function} [condition] - query parameters or function
 * @param {Object|Function} [projection] - mapping parameters or function
 */

function Cursor(collection, condition, projection) {
  this.collection = collection;
  this.source = new Source(this);
  this._source = this.source;
  this.obop = collection.obop();
  if (condition) {
    try {
      condition = this.obop.where(condition);
    } catch (e) {
      condition = null;
      this._error = e;
    }
    if (condition) {
      this.source = new Condition(this, condition);
    }
  }
  if (projection) {
    try {
      projection = this.obop.view(projection);
    } catch (e) {
      projection = null;
      this._error = e;
    }
    if (projection) {
      this.source = new Projection(this, projection);
    }
  }
}

utils.inherits(Cursor, Proto);

/**
 * This invokes a callback function with an index for all items of the collection whether a condition is given or not.
 *
 * @private
 * @param {Function} callback - function(err, list) {}
 * @returns {Cursor} instance itself for method chaining
 */

Cursor.prototype.index = function(callback) {
  var self = this;
  callback = callback || NOP;
  if (this._error) {
    callback(this._error);
    return this;
  }

  if (self._index) {
    var list = [].concat(self._index); // clone
    callback(null, list);
  } else {
    self.collection.index(function(err, list) {
      if (err) {
        callback(err);
      } else {
        self._index = list;
        list = [].concat(self._index); // clone
        callback(null, list);
      }
    });
  }
  return this;
};

/**
 * This invokes a callback function with a list of items found.
 *
 * @param {Function} callback - function(err, list) {}
 * @returns {Cursor} instance itself for method chaining
 * @example
 * collection.find().toArray(function(err, list) {
 *   if (err) {
 *     console.error(err);
 *   } else {
 *     list.forEach(function(item) {
 *       console.log(item);
 *     });
 *   }
 * });
 */

Cursor.prototype.toArray = function(callback) {
  var self = this;
  callback = callback || NOP;
  if (this._error) {
    callback(this._error);
    return this;
  }

  if (self._toArray) {
    var list = [].concat(self._toArray); // clone
    callback(null, list);
  } else {
    toArray(this.source, function(err, list) {
      if (err) {
        callback(err);
      } else {
        self._toArray = list;
        list = [].concat(self._toArray); // clone
        callback(null, list);
      }
    });
  }
  return this;
};

/**
 * This invokes a callback function with each items found.
 *
 * @param {Function} callback - function(err, item) {}
 * @returns {Cursor} instance itself for method chaining
 * @example
 * collection.find().each(function(err, item) {
 *   if (err) {
 *     console.error(err);
 *   } else if (!item) {
 *     // EOF
 *   } else {
 *     console.error(item);
 *   }
 * });
 */

Cursor.prototype.each = function(callback) {
  var self = this;
  callback = callback || NOP;
  if (this._error) {
    callback(this._error);
    return this;
  }

  this.nextObject(iterator);

  function iterator(err, item) {
    callback(err, item);
    if (!err && item) self.nextObject(iterator);
  }
};

/**
 * This invokes a callback function with the number of items found
 *
 * @param {Function} callback - function(err, count) {}
 * @returns {Cursor} instance itself for method chaining
 * @example
 * collection.find().count(function(err, count) {
 *   console.log(count);
 * });
 */

Cursor.prototype.count = function(callback) {
  callback = callback || NOP;
  if (this._error) {
    callback(this._error);
    return this;
  }

  var getlist = (this.source === this._source) ? this.index : this.toArray;
  getlist.call(this, function(err, list) {
    if (err) {
      callback(err);
    } else {
      callback(null, list.length);
    }
  });
  return this;
};

/**
 * This specifies a sort parameters
 *
 * @param {Function|Object} order - sort function or parameters
 * @returns {Cursor} instance itself for method chaining
 * @example
 * collection.find().sort(function(a, b){
 *   return a.price - b.price || b.stock - a.stock;
 * }).toArray();
 *
 * var sort = {price: 1, stock: -1});
 * collection.find().sort(sort).toArray(); // same order
 */

Cursor.prototype.sort = function(order) {
  this.source = new Sort(this, order);
  return this;
};

/**
 * This specifies a offset parameters
 *
 * @param {Number} offset - offset parameter
 * @returns {Cursor} instance itself for method chaining
 * @example
 * collection.find().offset(100).toArray();
 */

Cursor.prototype.offset = function(offset) {
  this.source = new Offset(this, offset);
  return this;
};

/**
 * This specifies a limit parameters
 *
 * @param {Number} limit - limit parameter
 * @returns {Cursor} instance itself for method chaining
 * @example
 * collection.find().limit(100).toArray();
 */

Cursor.prototype.limit = function(limit) {
  this.source = new Limit(this, limit);
  return this;
};

function Source(cursor) {
  this.collection = cursor.collection;
}

utils.inherits(Source, Proto);

Source.prototype.nextObject = function(callback) {
  var self = this;
  callback = callback || NOP;

  if (this.list) {
    if (!this.list.length) {
      callback(); // EOF
      return;
    } else {
      var id = this.list.shift();
      this.collection.read(id, callback);
      return;
    }
  }

  // read all keys at first
  this.collection.index(function(err, list) {
    if (err) return callback(err);
    self.list = list || [];
    self.nextObject(callback);
  });

  return this;
};

Source.prototype.rewind = function(callback) {
  delete this.list;
};

function Condition(cursor, condition) {
  this.source = cursor.source;
  this.condition = condition;
}

utils.inherits(Condition, Proto);

Condition.prototype.nextObject = function(callback) {
  var self = this;
  var source = this.source;
  var condition = this.condition;
  if ('function' != typeof condition) {
    var err = new Error('invalid condition: ' + condition);
    callback(err);
    return;
  }

  source.nextObject(next);

  function next(err, item) {
    if (err) {
      callback(err);
    } else if (!item) {
      callback(); // EOF
    } else if (condition(item)) {
      callback(null, item); // OK
    } else {
      source.nextObject(next); // NG
    }
  }
};

function Sort(cursor, order) {
  var sorter;
  this.source = cursor.source;
  try {
    this.sorter = cursor.obop.order(order);
  } catch (e) {
    this._error = e;
  }
}

utils.inherits(Sort, Proto);

Sort.prototype.nextObject = function(callback) {
  var self = this;
  callback = callback || NOP;
  if (this._error) {
    callback(this._error);
    return;
  }

  if (this.list) {
    var item = this.list.shift();
    callback(null, item);
    return;
  }

  toArray(this.source, function(err, list) {
    if (err) return callback(err);
    list = list || [];
    self.list = list.sort(self.sorter);
    self.nextObject(callback);
  });
};

Sort.prototype.rewind = function() {
  delete this.list;
  if (this.source.rewind) this.source.rewind();
};

function Offset(cursor, offset) {
  this.source = cursor.source;
  this.offset = offset;
}

utils.inherits(Offset, Proto);

Offset.prototype.nextObject = function(callback) {
  var self = this;
  var rest = this.offset;
  var source = this.source;
  callback = callback || NOP;

  if (this.ready || rest <= 0) {
    source.nextObject(callback);
  } else {
    source.nextObject(iterator);
  }

  function iterator(err, item) {
    if (err) {
      callback(err); // error on read
    } else if (!item) {
      callback(); // EOF
    } else if (--rest > 0) {
      source.nextObject(iterator); // next
    } else {
      self.ready = true;
      source.nextObject(callback);
    }
  }
};

Offset.prototype.rewind = function() {
  delete this.ready;
  Proto.prototype.rewind.call(this);
};

function Limit(cursor, limit) {
  this.source = cursor.source;
  this.limit = limit;
  this.rest = limit;
}

utils.inherits(Limit, Proto);

Limit.prototype.nextObject = function(callback) {
  var source = this.source;
  callback = callback || NOP;

  if (this.rest-- > 0) {
    source.nextObject(callback);
  } else {
    callback();
  }
};

Limit.prototype.rewind = function() {
  this.rest = this.limit;
  Proto.prototype.rewind.call(this);
};

function Projection(cursor, projection) {
  this.source = cursor.source;
  this.projection = projection;
}

utils.inherits(Projection, Proto);

Projection.prototype.nextObject = function(callback) {
  var self = this;
  var projection = this.projection;

  if ('function' != typeof projection) {
    var err = new Error('invalid projection: ' + projection);
    callback(err);
    return;
  }

  this.source.nextObject(function(err, item) {
    if (err) {
      callback(err);
    } else if (!item) {
      callback();
    } else {
      item = projection(item);
      callback(null, item);
    }
  });
};

function toArray(source, callback) {
  var buf = [];
  callback = callback || NOP;
  source.nextObject(iterator);

  function iterator(err, item) {
    // error on read
    if (err) {
      callback(err);
      return;
    }

    // last item
    if (!item) {
      callback(null, buf);
      return;
    }

    buf.push(item);

    source.nextObject(iterator);
  }
}

function NOP() {}
