/*global describe:true, it:true*/
'use strict';

var expect = require('expect.js');

describe('Host Info', function () {
  var hostInfo = require('../lib/hostinfo.js'),
      res = function (callback) {
        return { json: callback };
      },
      req = { params: { id: 'localhost' }};

  describe('Interface callback', function () {

    it('should be a function', function () {
      expect(hostInfo).to.be.a('function');
    });

    it('should return non empty object', function (next) {
      var expected = function (data) {
        expect(data).to.be.an('object');
        expect(data).not.to.be.empty();
        next();
      };
      hostInfo(req, res(expected), next);
    });

    describe('load', function () {
      it('should have certain structure', function (next) {
        var expected = function (data) {
          expect(data).to.have.property('load');
          expect(data.load).to.be.an('object');
          expect(data.load).to.only.have.keys('shortterm', 'midterm', 'longterm', 'last_update');
          next();
        };
        hostInfo(req, res(expected), next);
      });

      it('should return correct values', function (next) {
        var expected = function (data) {
          expect(data.load.shortterm).to.be(0.365);
          expect(data.load.midterm).to.be(0.445);
          expect(data.load.longterm).to.be(0.545);
          expect(data.load.last_update).to.be(1370643146);
          next();
        };
        hostInfo(req, res(expected), next);
      });

    });
    
    describe('memory', function () {
      it('should have certain structure', function (next) {
        var expected = function (data) {
          expect(data).to.have.property('memory');
          expect(data.memory).to.be.an('object');
          expect(data.memory).to.only.have.keys('used', 'free', 'cached', 'buffered');
          next();
        };
        hostInfo(req, res(expected), next);
      });

      it('should return correct values', function (next) {
        var expected = function (data) {
          expect(data.memory.used.value).to.be(20274995200);
          expect(data.memory.free.value).to.be(19360100352);
          expect(data.memory.cached.value).to.be(61302149120);
          expect(data.memory.buffered.value).to.be(434384896);
          next();
        };
        hostInfo(req, res(expected), next);
      });

    });
    
    describe('storage', function () {
      it('should have certain structure', function (next) {
        var expected = function (data) {
          expect(data).to.have.property('storage');
          expect(data.storage).to.be.an('object');
          expect(data.storage).to.only.have.keys('used', 'free', 'last_update');
          next();
        };
        hostInfo(req, res(expected), next);
      });

      it('should return correct values', function (next) {
        var expected = function (data) {
          expect(data.storage.used).to.be(2422134996992);
          expect(data.storage.free).to.be(3075423141888);
          expect(data.storage.last_update).to.be(1370643629);
          next();
        };
        hostInfo(req, res(expected), next);
      });

    });
    
    describe('vcpu', function () {
      it('should have certain structure', function (next) {
        var expected = function (data) {
          expect(data).to.have.property('vcpu');
          expect(data.vcpu).to.be.an('array');
          expect(data.vcpu).to.have.length(2);
          next();
        };
        hostInfo(req, res(expected), next);
      });

      it('should return correct values', function (next) {
        var expected = function (data) {
          expect(data.vcpu[0].value).to.be(0.10110609675666826);
          expect(data.vcpu[1].value).to.be(0.10110609675666826);
          next();
        };
        hostInfo(req, res(expected), next);
      });

    });

  });

});