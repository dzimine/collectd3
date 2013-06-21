
var assert = require('assert');
var rewire = require("rewire");

var stats = rewire("../stats");
var _ = require('lodash');

// Showing the way to 1) unit test with mocha and assert and 
// 2) use tests for testing private methods (rewire)
// TODO: consider a better assert library.

stats.__set__("collectDataRoot", __dirname + "/../testdata");

exports['test getInfoForAllHosts'] = function(done) {
  var keys = {
     shortterm: "ds[shortterm].value", 
     last_update: "last_update"
  };
  stats.__get__('getInfoForAllHosts')("load/load.rrd", keys)(function(err, data) {
      if (err) return done(err);
      assert.equal(3, _.keys(data).length, "Should have 3 datasets");
      assert.equal(_.keys(keys).length, _.keys(data.localhost).length, "Should fetch all keys");
      assert.equal(4.38, data.localhost.shortterm, "Should get correct value");
      done();
  });
}

exports['test getAggregateInfo'] = function(done) {
   var reqmock = {}
   resmock.assertCallback = function(data) {
      try {
         assert.equal(Object.keys(data).length, 4);
         assert.equal(Object.prototype.toString.call( data.load ), '[object Object]');
         assert.equal(Object.prototype.toString.call( data.memory ), '[object Object]');
         assert.equal(Object.prototype.toString.call( data.storage ), '[object Object]');
         assert.equal(Object.prototype.toString.call( data.ips ), '[object Object]');
         done();
      } catch (err) { done (err); }
   }
   stats.getAggregateInfo(reqmock, resmock, nextmock);
}

exports['test aggregateLoad'] = function(done) {
   stats.__get__('aggregateLoad')(function(err, data) {
      if (err) return done(err);
      assert.equal(Object.keys(data).length, 2, "Should have 2 parameters");
      assert.equal(data.average, 0.73, "Should get correct value of average");
      assert.equal(data.peak, 0.73, "Should get correct value of peak");
      done();
   });
}

exports['test aggregateMemory'] = function(done) {
   stats.__get__('aggregateMemory')(function(err, data) {
      if (err) return done(err);
      assert.equal(Object.keys(data).length, 2, "Should have 2 parameters");
      assert.equal(data.allocated, 28, "Should get correct value of allocated");
      assert.equal(data.committed, 20.000660230483472, "Should get correct value of committed");
      done();
   });
}

exports['test aggregateStorage'] = function(done) {
   stats.__get__('aggregateStorage')(function(err, data) {
      if (err) return done(err);
      assert.equal(Object.keys(data).length, 2, "Should have 2 parameters");
      assert.equal(data.allocated, 79, "Should get correct value of allocated");
      assert.equal(data.committed, 44.05837893486023, "Should get correct value of committed");
      done();
   });
}

exports['test aggregateIPs'] = function(done) {
   stats.__get__('aggregateIPs')(function(err, data) {
      if (err) return done(err);
      assert.equal(Object.keys(data).length, 2, "Should have 2 parameters");
      assert.equal(data.allocated, 95, "Should get correct value of allocated");
      assert.equal(data.committed, 88, "Should get correct value of committed");
      done();
   });
}

exports['test getHostInfo'] = function(done) {
   var reqmock = { route: { params: { id: "localhost" }}};
   
   resmock.assertCallback = function(data) {
      try {
         assert.equal(Object.keys(data).length, 4);
         assert.equal(Object.prototype.toString.call( data.load ), '[object Object]');
         assert.equal(Object.prototype.toString.call( data.memory ), '[object Object]');
         assert.equal(Object.prototype.toString.call( data.storage ), '[object Object]');
         assert.equal(Array.isArray( data.vcpu ), true);
         done();
      } catch (err) { done (err); }
   }
   stats.getHostInfo(reqmock, resmock, nextmock);
}

exports['test hostInfoLoad'] = function(done) {
   stats.__get__('hostInfoLoad')("localhost")(function(err, data) {
      if (err) return done(err);
      assert.equal(Object.keys(data).length, 4, "Should have 4 parameters");
      assert.equal(data.shortterm, 0.73, "Should get correct value of shortterm");
      assert.equal(data.midterm, 0.89, "Should get correct value of midterm");
      assert.equal(data.longterm, 1.09, "Should get correct value of longterm");
      assert.equal(data.last_update, 1370643146, "Should get correct value of last_update");
      done();
   });
}

exports['test hostInfoMemory'] = function(done) {
   stats.__get__('hostInfoMemory')("localhost")(function(err, data) {
      if (err) return done(err);
      assert.equal(Object.keys(data).length, 4, "Should have 4 parameters");
      assert.equal(data.cached.value, 61302149120, "Should get correct value of cached");
      assert.equal(data.free.value, 19360100352, "Should get correct value of free");
      assert.equal(data.used.value, 20274995200, "Should get correct value of used");
      assert.equal(data.buffered.value, 434384896, "Should get correct value of buffered");
      done();
   });
}

exports['test hostInfoStorage'] = function(done) {
   stats.__get__('hostInfoStorage')("localhost")(function(err, data) {
      if (err) return done(err);
      assert.equal(Object.keys(data).length, 3, "Should have 3 parameters");
      assert.equal(data.used, 2422134996992, "Should get correct value of used");
      assert.equal(data.free, 3075423141888, "Should get correct value of free");
      assert.equal(data.last_update, 1370643629, "Should get correct value of last_update");
      done();
   });
}

exports['test hostInfoVcpu'] = function(done) {
   stats.__get__('hostInfoVcpu')("localhost")(function(err, data) {
      if (err) return done(err);
      assert.equal(Array.isArray( data ), true, "Should be array");
      assert.equal(data[0].value, 0.10110609675666826, "Should get correct value");
      done();
   });
}

exports['test getHostGraph'] = function(done) {
   var reqmock = { params: { id: "localhost" }, query: { period: 'week' }};
   
   resmock.assertCallback = function(data) {
      try {
         assert.equal(Object.keys(data).length, 3);
         assert.equal(Array.isArray( data.load ), true);
         assert.equal(Array.isArray( data.memory ), true);
         assert.equal(Array.isArray( data.storage ), true);
         done();
      } catch (err) { done (err); }
   }
   stats.getHostGraph(reqmock, resmock, nextmock);
}

exports['test hostGraphLoad'] = function(done) {
   stats.__get__('hostGraphLoad')("localhost", {
         from: 1370557260,
         to: 1370643660
      })(function(err, data) {
      if (err) return done(err);
      assert.equal(Array.isArray( data ), true, "Should be array");
      assert.equal(data[0][0], 1370557300, "Should get correct value of timestamp");
      assert.equal(data[0][1], 1.132, "Should get correct value of load");
      done();
   });
}

exports['test hostGraphMemory'] = function(done) {
   stats.__get__('hostGraphMemory')("localhost", {
         from: 1370557260,
         to: 1370643660
      })(function(err, data) {
      if (err) return done(err);
      assert.equal(Array.isArray( data ), true, "Should be array");
      assert.equal(data[0][0], 1370557300, "Should get correct value of timestamp");
      assert.equal(data[0][1], 52.654451274025696, "Should get correct value of memory");
      done();
   });
}

exports['test hostGraphStorage'] = function(done) {
   stats.__get__('hostGraphStorage')("localhost", {
         from: 1370557260,
         to: 1370643660
      })(function(err, data) {
      if (err) return done(err);
      assert.equal(Array.isArray( data ), true, "Should be array");
      assert.equal(data[0][0], 1370557300, "Should get correct value of timestamp");
      assert.equal(data[0][1], 42.93345354261594, "Should get correct value of storage");
      done();
   });
}

exports['test getLoadInfo'] = function(done) {
   resmock.assertCallback = function(data) {
      try {
         assert.equal(3, data.heatmap.length);
         assert.ok(data.heatmap
            .reduce(function(a, b){
               return (b.key == "localhost") ?  true : a;
            }, false), 
            "Data should contain 'localhost'"
         );
         done();
      } catch (err) { done (err); }
   }
   stats.getLoadInfo(reqmock, resmock, nextmock);
}

exports['test getMemoryInfo'] = function(done) {
   resmock.assertCallback = function(data) {
      try {
         //console.log(JSON.stringify(data, null, 3));
         var heatmap = data["heatmap"];
         assert.ok(heatmap, "Should contain heatmap");
         assert.equal(3, heatmap.length);
         //check if heatmap contains array with a giveh host host name
         assert.ok(heatmap
            .reduce(function(a, b){
               return (b.key == "localhost") ?  true : a;
            }, false), 
            "Data should contain 'localhost'");
         assert.equal(heatmap[2].value, 0.5115414739797925, "Should have correct value");
         assert.equal(heatmap[2].details.used, 20274995200, "Should have correct value");
         assert.equal(heatmap[2].details.free, 19360100352, "Should have correct value");
         done();
      } catch (err) { done (err); }
   }
   stats.getMemoryInfo(reqmock, resmock, nextmock);

}

/////////////////////////////////////
// Mocks 


var reqmock = { 
   params: { id:"localhost"}, 
   query:{from: 1370556816, to: 1370643216, r:10000} 
};

var resmock = { 
   assertCallback: {},
   data: [],
   json: function (data) {
        //console.log(JSON.stringify(this.data, null, 4));
        this.assertCallback(data);
    }

};

var nextmock = function(err) { console.log(err); }


