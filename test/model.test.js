"use strict";

const _ = require('lodash');
const co = require('co');
const IntegerModel = require('./IntegerModel');

describe('AbstractModel', function() {

  describe('#create', function() {

    it('should create a row from a model', function(done) {

      co(function *() {
        let model = yield IntegerModel.create({integer: 1});
        assert(model, 1);
      }).then(done).catch(done);

    });

  });

  describe('#fromRow', function() {

    let rows = _.range(0, 20).map(function(int) {
      return {
        integer: int
      }
    });

    let expected = _.range(0, 20).map(function(int) {
      return {
        integer: int,
        abc: 'xyz',
        xyz: 'abc'
      }
    });

    it('should wait for *load() to finish', function(done) {

      co(function *() {
        let models = yield IntegerModel.fromRow(rows);
        models.forEach(function(model, index) {
          assert(model, index);
        });
        models.should.be.eql(expected);
      }).then(done).catch(done);

    });

  });

});

function assert(model, expectedInt) {
  model.abc.should.be.eql('xyz');
  model.xyz.should.be.eql('abc');
  model.integer.should.be.eql(expectedInt);
  (model instanceof IntegerModel).should.be.ok;
}