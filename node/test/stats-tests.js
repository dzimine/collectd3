
var assert = require('assert');
var rewire = require("rewire");

var stats = rewire("../stats");

// Showing the way to 1) unit test with mocha and assert and 
// 2) use tests for testing private methods (rewire)
// TODO: consider a better assert library.

stats.__set__("collectDataRoot", __dirname + "/../testdata");

exports['test getInfoForAllHosts'] = function(done) {
  var keys = ["ds[shortterm].value", "last_update"];
  stats.__get__('getInfoForAllHosts')("load/load.rrd", keys, function(err, data) {
      if (err) return done(err);
      assert.equal(3, data.length, "Should have 3 datasets");
      assert.equal(keys.length+1, data[1].length, "Should fetch all keys");
      assert.equal(4.38, data[0][1], "Should get correct value");
      done();
  });
}

exports['test formatOutput (from rrdtool fetch)'] = function(done) {
   var testRRDOutput = "                      shortterm\t            midterm            longterm\n\n1367470930:     1.2895508000e+00      9.0195340000e-01    7.9726560000e-01\n1367471000:   9.5126940000e-01 8.6943340000e-01 7.8945340000e-01\n1367471070: 9.8281240000e-01     8.6503940000e-01 7.9101580000e-01\n1367471140: 9.6640640000e-01 8.6582020000e-01 7.9179720000e-01\n1367471210: 1.0945312000e+00 9.0048840000e-01 8.0937520000e-01\n1367471280: 8.1669900000e-01 8.5703120000e-01 7.9570320000e-01\n1367471350: 9.3115220000e-01 8.6093720000e-01 8.0019540000e-01\n1367471420: 1.0118160000e+00 8.8808600000e-01 8.1308620000e-01\n1367471490: 9.2900380000e-01 8.7529340000e-01 8.1191440000e-01\n1367471560: 1.1000974000e+00 9.1171840000e-01 8.2949240000e-01\n1367471630: 1.2575198000e+00 9.7070300000e-01 8.5576160000e-01\n1367471700: 1.5767576000e+00 1.0979492000e+00 9.0634780000e-01\n1367471770: 1.3041992000e+00 1.0753906000e+00 9.1201180000e-01\n1367471840: 1.1031252000e+00 1.0546874000e+00 9.1025380000e-01\n1367471910: 1.1807616000e+00 1.0236332000e+00 9.1240260000e-01\n1367471980: 1.1753904000e+00 1.0338864000e+00 9.2382800000e-01\n1367472050: 1.1268554000e+00 1.0296876000e+00 9.2382800000e-01\n1367472120: nan nan nan";
   
   var res = stats.__get__('formatOutput')(testRRDOutput);
   assert.equal(res.length, 3, "shall return three result sets");
   assert.equal(res[0].key, 'shortterm', 'first key is shortterm');
   assert.equal(res[0].values.length, 16, 'values has 16 elements');
   assert.equal(res[1].values.length, 16, 'values has 16 elements');
   assert.equal(res[2].values.length, 16, 'values has 16 elements');
   done();
}

exports['test getMemory'] = function(done) {
   resmock.assertCallback = function(data) {
      //console.log(JSON.stringify(data, null, 3));
      assert.equal(data[0].key, 'used', 'should fetch used memory');
      assert.equal(data[0].values.length, 39, 'active should have 39 data points');
      assert.equal(data[1].key, 'free', 'should fetch free memory');
      done();
   }
   stats.getMemory(reqmock, resmock, nextmock);

}

exports['test getCpuHeatmap'] = function(done) {
   resmock.assertCallback = function(data) {
      try {
         assert.equal(3, data.length);
         assert.ok(data
            .reduce(function(a, b){
               return (b[0] == "localhost") ?  true : a;
            }, false), 
            "Data should contain 'localhost'"
         );
         done();
      } catch (err) { done (err); }
   }
   stats.getCpuHeatmap(reqmock, resmock, nextmock);
}

exports['test getMemoryHeatmap'] = function(done) {
   resmock.assertCallback = function(data) {
      try {
         //console.log(JSON.stringify(data, null, 3));
         assert.equal(3, data.length);
         //check if data contains array with a giveh host host name
         assert.ok(data
            .reduce(function(a, b){
               return (b[0] == "localhost") ?  true : a;
            }, false), 
            "Data should contain 'localhost'");
         assert.equal(data[2][1], 121649971200, "Should have correct value");
         done();
      } catch (err) { done (err); }
   }
   stats.getMemoryHeatmap(reqmock, resmock, nextmock);

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


