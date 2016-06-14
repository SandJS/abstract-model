"use strict";

const bind = require('co-bind');
const _ = require('lodash');
const co = require('co');
const pasync = require('pasync');
const EventEmitter = require('events').EventEmitter;

const MAP_LIMIT_DEFAULT = 10;

class AbstractModel {

  constructor() {

  }

  /**
   * Loads a database row from a database query. Override this method to load custom properties onto a row object
   *
   * @param row {PlainObject} - the original database row
   * @param opts {PlainObject} - user defined options that customize how the row is modified
   *
   * @returns {AbstractModel} NOTE: all overrides to this method MUST return `this`
   */
  *load(row, opts) {
    _.extend(this, row);
    return this
  }

  /**
   * Creates a new instance of this class initialized with the given row and calls its *load() GeneratorFunction.
   *
   * @param row {PlainObject} - see *load
   * @param opts {PlainObject} - see *load
   *
   * @returns {Promise}
   */
  static create(row, opts) {
    if (!(row instanceof this)) {
      let obj = new this(row, opts);
      return co(bind(obj.load, obj, row, opts));
    } else {
      return Promise.resolve(row);
    }
  }

  /**
   * This property indicates if the fromRow function has been called at least once. This is used in the fromRow function which
   * passes an `isTop` property in the options so that the original caller of this can distinguish between top level
   * calls to fromRow and lower level calls. Consider two classes: `Object1` and `Object2`. In it's *load function `Object1`
   * initializes a property of type `Object2`. In it's *load function `Object2` initializes a property of type `Object1`.
   * An infinite loop occurs when an object or array of objects of type `Object1` call `fromRow()` and load a property of
   * type `Object2` which internally calls `fromRow()` on it's own custom property of type `Object1` which loads a property
   * of type `Object2`, etc... This can be fixed by checking if `isTop` is true, so that when an array of objects is
   * "fromRow"ed to be returned as the main API response, they will all get `isTop === true` and any sub calls within them,
   * will get `isTop === false`. You shouldn't need to call this outside of the contexts described
   *
   * @private
   *
   * @returns {boolean}
   */
  static get isTopLevel() {

    let val = this.context('AbstractModel').isTop;
    this.context('AbstractModel').isTop = false;
    return val;
  }

  /**
   * 1) Loads a row or group of rows in parallel mapLimited fashion,
   * 2) Applies `create` to each row
   *
   * @param rows
   * @param opts
   * @returns {*}
   */
  static fromRow(rows, opts) {
    this.init();

    opts = _.defaults({}, opts, {isTop: AbstractModel.isTopLevel});
    let cls = this;
    return co(function *() {

      if (rows instanceof Promise) {
        rows = yield rows;
      }

      if (!rows) {
        return Promise.resolve(null);
      }

      function domainBind(cb) {
        if (process.domain) {
          return process.domain.bind(cb);
        } else {
          return cb;
        }
      }

      if (_.isArray(rows)) {
        return pasync.mapLimit(rows, MAP_LIMIT_DEFAULT, domainBind(function (row) {
          return row instanceof cls ? Promise.resolve(row) : cls.create(row, opts);
        }));

      } else if (isNumericMap(rows)) {
        return pasync.mapValuesLimit(rows, MAP_LIMIT_DEFAULT, domainBind(function (row) {
          return row instanceof cls ? Promise.resolve(row) : cls.create(row, opts);
        }));

      } else {
        return rows instanceof cls ? Promise.resolve(rows) : cls.create(rows, opts);
      }

    });
  }

  /**
   * @private
   */
  static init() {
    let context = this.context('AbstractModel');
    context.isTop = true;
  }

  static context(key) {
    return {};
    //let context = sand.context;
    //
    //key = key || this.name;
    //
    //if (key) {
    //  key = '_' + key;
    //
    //  if (!context[key]) {
    //    context[key] = {};
    //  }
    //
    //  return context[key];
    //}
    //
    //return context;
  }

}

module.exports = AbstractModel;

/**
 * Checks if the object passed in is an object with all numeric keys. This is used to test if we should wrap all values
 * in the numeric map.
 *
 * @param map
 * @returns {boolean}
 *
 * @private
 */
function isNumericMap(map) {
  let isNumericMap = false;
  if (!_.isArray(map)) {
    for (let key in map) {
      if (!isNaN(key)) {
        isNumericMap = true;
      }
      break;
    }
  }

  return isNumericMap;
}
