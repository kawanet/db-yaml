/*! update.js */

/**
 * This exports update() function which parses update operators.
 *
 * @module obop.update
 * @see http://docs.mongodb.org/manual/reference/operator/#update-operators
 */

/**
 * This generates an update function from specified operator object.
 *
 * @param {Object|Function} update - update operators or function
 * @returns {Function} function for array.map() etc.
 */

exports.update = function(update) {
  // function type
  if ('function' == typeof update) {
    return update;
  }

  // default operator
  update = update || {};

  // no operators: through
  if (!Object.keys(update)) {
    return null;
  }

  // other types than object
  if ('object' != typeof update) {
    throw new Error('invalid update: ' + update);
  }

  // supported operators
  var ope = {
    $set: 1,
    $unset: 1,
    $rename: 1,
    $push: 1,
    $pull: 1,
    $inc: 1
  };

  // check operators supported or not
  for (var key in update) {
    if (ope[key] && 'object' === typeof update[key]) continue;
    throw new Error('invalid update operator: ' + key);
  }

  // update function
  return function(item) {
    var key, val, old;

    // through when empty
    if (!item) return item;

    // Sets the value of a field in an existing document.
    if (update.$set) {
      for (key in update.$set) {
        item[key] = update.$set[key];
      }
    }

    // Removes the specified field from an existing document.
    if (update.$unset) {
      for (key in update.$unset) {
        delete item[key];
      }
    }

    // Renames a field.
    if (update.$rename) {
      for (key in update.$rename) {
        val = update.$rename[key];
        item[val] = item[key];
        delete item[key];
      }
    }

    // Adds an item to an array.
    if (update.$push) {
      for (key in update.$push) {
        old = item[key];
        if (old instanceof Array) {
          // ok
        } else if ('undefined' == typeof old) {
          item[key] = [];
        } else {
          item[key] = [old];
        }
        val = update.$push[key];
        item[key].push(val);
      }
    }

    // Removes items from an array that match a query statement.
    if (update.$pull) {
      for (key in update.$pull) {
        val = update.$pull[key];
        old = item[key];
        if (old instanceof Array) {
          var tmp = [];
          var len = old.length;
          for(var i=0; i<len; i++) {
            var test = old[i];
            if (val != test) tmp.push(test);
          }
          item[key] = tmp;
        } else if (val == old) {
          item[key] = []; // empty array
        }
      }
    }

    // Increments the value of the field by the specified amount.
    if (update.$inc) {
      for (key in update.$inc) {
        val = update.$inc[key];
        old = item[key];
        val = parseFloat(val) || 0;
        old = parseFloat(old) || 0;
        item[key] = old + val;
      }
    }
    return item;
  };
};
