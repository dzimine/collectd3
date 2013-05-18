var exec = require('child_process').execFile;

var fetchRRD = function (rrd_file, cf, from, to, resolution, callback) {
   //TODO: wrtie the code to respect defaults
   var rrdtool= "rrdtool"; 
   var args = ["fetch", rrd_file, cf, "--start", from, "--end",  to, "-r", resolution];
   console.log("Running: ", rrdtool, args.join(" "));      

   var child = exec(rrdtool, args, function(err, stdout, stderr) {
          if (err) {
            console.log("Error:  ", err);
            console.log("stderr: ", stderr);
            callback(err);
         }
         callback(null, stdout);
      });
}

var getAll = exports.getAll = function(req, res, next) {
   fetchRRD("sampledata/load.rrd", "MAX", 1367470900, 1367477900, 100, 
      function(err, data){
         if (err) { 
         	next(err);
         } else {
   	      res.json(formatOutput(data)); 
	      }
      });
}


var formatOutput = function (data) {
   // split by lines
   var lines = data.split('\n');
   // parse out the keys from the header line
   var keys = lines[0].split(/[\s,]+/);
   // create d3 friendly output data structure
   var res = [];
   for (var k=1; k< keys.length; k++) {
   	res.push({ key: keys[k], values: []});
   }
   // Loop lines and fill up the data points
   // TODO: figure better way to handle [nan, nan, nan]?
   // For now: assuming last line is empty, the prev is time [nan,nan,nan...]
   for (var i = 2; i < (lines.length-2); i++) {
      var s1 = lines[i].split(/:\s+/);
      var t = s1[0];
      if (s1[1] == null) continue;
      var values = s1[1].split(/\s+/);
      for (var v=0; v<values.length; v++) {
      	res[v].values.push([t,values[v]]);
      }
   }
   return res;
};

// Quick & dirty testing
// teststr = "                      shortterm             midterm            longterm\n\n1367470930: 		1.2895508000e+00      9.0195340000e-01    7.9726560000e-01\n1367471000:   9.5126940000e-01 8.6943340000e-01 7.8945340000e-01\n1367471070: 9.8281240000e-01 		8.6503940000e-01 7.9101580000e-01\n1367471140: 9.6640640000e-01 8.6582020000e-01 7.9179720000e-01\n1367471210: 1.0945312000e+00 9.0048840000e-01 8.0937520000e-01\n1367471280: 8.1669900000e-01 8.5703120000e-01 7.9570320000e-01\n1367471350: 9.3115220000e-01 8.6093720000e-01 8.0019540000e-01\n1367471420: 1.0118160000e+00 8.8808600000e-01 8.1308620000e-01\n1367471490: 9.2900380000e-01 8.7529340000e-01 8.1191440000e-01\n1367471560: 1.1000974000e+00 9.1171840000e-01 8.2949240000e-01\n1367471630: 1.2575198000e+00 9.7070300000e-01 8.5576160000e-01\n1367471700: 1.5767576000e+00 1.0979492000e+00 9.0634780000e-01\n1367471770: 1.3041992000e+00 1.0753906000e+00 9.1201180000e-01\n1367471840: 1.1031252000e+00 1.0546874000e+00 9.1025380000e-01\n1367471910: 1.1807616000e+00 1.0236332000e+00 9.1240260000e-01\n1367471980: 1.1753904000e+00 1.0338864000e+00 9.2382800000e-01\n1367472050: 1.1268554000e+00 1.0296876000e+00 9.2382800000e-01\n1367472120: nan nan nan";
// var resmock = { json: function (data) {
// 	console.log(JSON.stringify(data, null, 2));
// }};
// var nextmock = function(err) { console.log(err); }
// getAll(null,resmock, nextmock);

