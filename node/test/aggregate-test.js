/*global describe:true, it:true*/
'use strict';

var expect = require('expect.js');

describe('Aggregate Info', function () {
  var aggregate = require('../lib/aggregate.js'),
      res = function (callback) {
        return { json: callback };
      },
      req = null;

  describe('Interface callback', function () {

    it('should be a function', function () {
      expect(aggregate).to.be.a('function');
    });

    it('should return non empty object', function (next) {
      var expected = function (data) {
        expect(data).to.be.an('object');
        expect(data).not.to.be.empty();
        next();
      };
      aggregate(req, res(expected), next);
    });

    describe('load', function () {
      it('should have certain structure', function (next) {
        var expected = function (data) {
          expect(data).to.have.property('load');
          expect(data.load).to.have.property('average');
          expect(data.load).to.have.property('peak');
          expect(data.load.average).to.be.a('number');
          expect(data.load.peak).to.be.a('number');
          next();
        };
        aggregate(req, res(expected), next);
      });

      it('should return correct values', function (next) {
        var expected = function (data) {
          expect(data.load.average).to.be(0.6083333333333333);
          expect(data.load.peak).to.be(0.73);
          next();
        };
        aggregate(req, res(expected), next);
      });

    });
    
    describe('memory', function () {
      it('should have certain structure', function (next) {
        var expected = function (data) {
          expect(data).to.have.property('memory');
          expect(data.memory).to.have.property('allocated');
          expect(data.memory).to.have.property('committed');
          expect(data.memory.allocated).to.be.a('number');
          expect(data.memory.committed).to.be.a('number');
          next();
        };
        aggregate(req, res(expected), next);
      });

      it('should return correct values', function (next) {
        var expected = function (data) {
          expect(data.memory.allocated).to.be(28);
          expect(data.memory.committed).to.be(20.000660230483472);
          next();
        };
        aggregate(req, res(expected), next);
      });

    });
    
    describe('storage', function () {
      it('should have certain structure', function (next) {
        var expected = function (data) {
          expect(data).to.have.property('storage');
          expect(data.storage).to.have.property('allocated');
          expect(data.storage).to.have.property('committed');
          expect(data.storage.allocated).to.be.a('number');
          expect(data.storage.committed).to.be.a('number');
          next();
        };
        aggregate(req, res(expected), next);
      });

      it('should return correct values', function (next) {
        var expected = function (data) {
          expect(data.storage.allocated).to.be(79);
          expect(data.storage.committed).to.be(44.05837893486023);
          next();
        };
        aggregate(req, res(expected), next);
      });

    });
    
    describe('ips', function () {
      it('should have certain structure', function (next) {
        var expected = function (data) {
          expect(data).to.have.property('ips');
          expect(data.ips).to.have.property('allocated');
          expect(data.ips).to.have.property('committed');
          expect(data.ips.allocated).to.be.a('number');
          expect(data.ips.committed).to.be.a('number');
          next();
        };
        aggregate(req, res(expected), next);
      });

      it('should return correct values', function (next) {
        var expected = function (data) {
          expect(data.ips.allocated).to.be(95);
          expect(data.ips.committed).to.be(88);
          next();
        };
        aggregate(req, res(expected), next);
      });

    });

  });

});