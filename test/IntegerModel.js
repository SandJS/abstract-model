"use strict";

const AbstractModel = require('..').AbstractModel;

class IntegerModel extends AbstractModel {

  *load(row, opts) {
    yield super.load(row, opts);
    this.abc = 'xyz';
    this.xyz = yield new Promise(function(resolve) {
      setTimeout(function() {
        resolve('abc');
      }, 500);
    });
    return this;
  }

}

module.exports = IntegerModel;