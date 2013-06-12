var fs = require('fs');
var execFile = require('child_process').execFile;
var async = require('async');
var rrd = require("rrd");
var rrdtool= "rrdtool"; 

/******************************************************************************/
//  CONFIGURATION 
//   The root of rrd data, collected by collectd
var collectDataRoot = __dirname + "/sampledata";


/******************************************************************************/

var getCpuLoad = exports.getCpuLoad = function(req, res, next) {
   fetchRRD("load/load.rrd", "MAX", req, 
      function(err, data) {
         if (err) { 
            next(err);
         } else {
            res.json(formatOutput(data)); 
         }
      });
}

var getMemory = exports.getMemory = function(req, res, next) {
   async.parallel([
         function (callback) {
               fetchRRD("memory/memory-used.rrd", "AVERAGE", req, callback);
         }, 
         function (callback) {
               fetchRRD("memory/memory-free.rrd", "AVERAGE", req, callback);
         }
      ],
      function(err, data){ 
         if (err) { 
            next(err);
         } else {
            var keyLabels = ["used", "free"];
            var results = [];
            for (var i = 0; i < data.length; i++) {
               var record = formatOutput(data[i]);
               results = results.concat(formatOutput(data[i]));
               results[i]["key"]=keyLabels[i];
            }
            res.json(results); 
         }
      }
   );
}

var getLoadInfo = exports.getLoadInfo = function(req, res, next) {
   async.waterfall([
      wrap(getInfoForAllHosts, ["load/load.rrd", ["ds[shortterm].value", "ds[midterm].value", "ds[longterm].value", "last_update"]]),
      wrap(normalizeLoad, [[1,2,3]])
   ], function (err, data) {
      if (err) {
         next(err);
      } else {
         var output = {
            heatmap: data.map(function (e) { return [e[0], e[1], e[4]]; }),
            average: {
               shortterm: data
                  .map(function (e) { return e[1]; })
                  .reduce(function(a, b) { return a + b }) / data.length,
                  
               midterm: data
                  .map(function (e) { return e[2]; })
                  .reduce(function(a, b) { return a + b }) / data.length,
                  
               longterm: data
                  .map(function (e) { return e[3]; })
                  .reduce(function(a, b) { return a + b }) / data.length
            }
         };
         res.json(output);
      }
   });
}

var getMemoryHeatmap = exports.getMemoryHeatmap = function(req, res, next) {
   getInfoForAllHosts("memory/memory-used.rrd", 
      ["ds[value].value", "last_update"], 
      function(err, data) {
         if (err) {
            next(err);
         } else {
            res.json(data);
         }
      });
}

var aggregateInfo = exports.aggregateInfo = function (req, res, next) {
   async.parallel({
      load: aggregateLoad,
      memory: aggregateMemory,
      storage: aggregateStorage,
      ips: aggregateIPs
   }, function (err, data) {
      if (err) {
         next(err);
      } else {
         res.json(data);
      }
   });
}

/**
* fetchRRD: Calls rrdtool and returns the data. 
* rrd_file - relative path to rrd file collectDataRoot/{host_id} 
* cf - RRD Config Fucnction (AVERAGE, MIN, MAX, LAST) 
* req - passthrough request parameters, must have host id, may have start/end/resolution.
* 
* Note: it uses execFile, thus will throw if rdtool output result > 200Mb
* If the buffer is bigger, one can switch to spawn, 
* but think again: why returning big data to the client?
*/
var fetchRRD = function (rrd_file, cf, req, callback) {

   var host = req.params.id;
   var rrd_file_path = collectDataRoot + "/" + host + "/" + rrd_file;
   var params = [];
   //TODO: set good defaults to avoid buffer overflow
   if (req.query.from) { params.push("--start", req.query.from); }
   if (req.query.to) { params.push("--end", req.query.to); }
   if (req.query.r) { params.push("-r", req.query.r); }
  
   var args = ["fetch", rrd_file_path, cf].concat(params);
   console.log("Running: ", rrdtool, args.join(" "));      

   var child = execFile(rrdtool, args, function(err, stdout, stderr) {
          if (err) {
            callback(err);
         } else { 
            callback(null, stdout);
         }
      });
}

/**
 * Runs node_rrd rrd.info for a given path and host.
 * On any error (e.g file doesn't exist, returns empty data set 
 */
var infoRRD = function (rrd_file, host, callback) {
   var rrd_file_path = collectDataRoot + "/" + host + "/" + rrd_file;
   rrd.info(rrd_file_path, function(info) {
      callback(info);
   }); 
}

/**
*  Takes rrdtool outpoot and transforms it to d3 data
*  rrdtool output: time: value[0],value[1],value[2]... (see output.txt for a sample)
*  d3 data [{key:key, value[]}...] (see d3 or nvd3 samples)
*/
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
   // For now: assuming that 1) last line is empty, 2) the prev is time [nan,nan,nan...]
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

/**
* Iterates all 'host' folders under collectd data root, and calls info on the specified rrd file,
* and returns an array of results [{host:hostname,info:data}...]
* @param path - path to the .rrd file in collectd structure, relative to "host" directory
* @param info - list of rrd info keys which we need values for
* @param callback(err, data) - calls with (err, null) on error, and (null, data)
* where data is an array of info outputs. 
*/
var getInfoForAllHosts = function (path, keys, callback) {
   fs.readdir(collectDataRoot, function(err, filenames){
      if (err) {
         callback(err);
      } else {
         var d =[];
         // CAREFUL! make sure cb() is called for each item!
         // Using async.each is prone to missing cb() call on some code paths,
         // which results in no call to a final callback 
         async.each(filenames, function(host, cb) {
            var dir = collectDataRoot + "/" + host;
            var filepath = [collectDataRoot, host, path].join("/");

            fs.stat(dir, function(err, stat){
               if(stat.isFile()) {
                  console.log("WARNING: [%s] not a directory, ignoring...", host);
                  cb();
               } else {
                  fs.exists(filepath, function(exists){
                     if (!exists) {
                        console.log("WARNING: %s doesn't exist", filepath);
                        cb();
                     } else {
                        infoRRD(path, host, function(info) {
                           var data = [host];
                           // infoRRD returns empty data on error - ingore and send no-data
                           keys.forEach(function(key, i) {
                              if (info.hasOwnProperty(key)) {
                                 data.push(info[key]);
                              }
                           });
                           d.push(data);
                           cb();
                        });
                     }
                  });
               }
            })
         }, function (err, data) {
            callback(err, d);
         });
      }
   });
}

/**
* Normalizes Load Average based on a number of cores.
* @param cols - array of indices of columns to normalize
* @param data - array of data to normalize
* @param callback - calls with (err, null) on error, and (null, data)
* where data is an array of info outputs.
*/
var normalizeLoad = function (cols, data, callback) {
   if (!callback) {
      callback = data;
      data = cols;
      cols = [1]
   }
   
   async.each(data, function (server, cb) {
      var dir = collectDataRoot + '/' + server[0]
      var str = "cpu-";
      
      fs.readdir(dir, function (err, filenames) {
         if (err) {
            cb(err);
         } else {
            var numberOfCpus = filenames.filter(function (e) { return e.slice(0, str.length) === str;}).length;
            cols.forEach(function (i) { server[i] = server[i] / numberOfCpus });
            cb();
         }
      });
   }, function (err) {
      callback(err, data)
   });
};

/**
* Collects and calculates specific types of stats for a whole system.
*/
var aggregateLoad = function (cb) {
   getInfoForAllHosts("load/load.rrd", 
      ["ds[shortterm].value", "last_update"], 
      function(err, data) {
         if (err) {
            cb(err);
         } else {
            normalizeLoad(data, function (err, data) {
               if (err) {
                  cb(err);
               } else {
                  var load = data.map(function (e) { return e[1]});
                  var sum = load.reduce(function(a, b) { return a + b });
                  var ave = sum / load.length;
                  var max = Math.max.apply(this, load)
                  
                  cb( null, { average: ave, peak: max } );
               }
            });
         }
      });
};

var aggregateMemory = function (cb) {
   async.parallel([
      wrap(getInfoForAllHosts, ["memory/memory-used.rrd", ["ds[value].value", "last_update"]]),
      wrap(getInfoForAllHosts, ["memory/memory-free.rrd", ["ds[value].value", "last_update"]]),
      wrap(getInfoForAllHosts, ["memory/memory-cached.rrd", ["ds[value].value", "last_update"]]),
      wrap(getInfoForAllHosts, ["memory/memory-buffered.rrd", ["ds[value].value", "last_update"]])
   ], function (err, data) {
      if (err) {
         cb(err)
      } else {
         var total = []
            .concat.apply([], data)                   // flattening all results into one array
            .map(function (e) { return e[1] })        // extract values
            .reduce(function(a, b) { return a + b }); // sum all values
      
         var used = data[0]
            .map(function (e) { return e[1] })        // extract values
            .reduce(function(a, b) { return a + b }); // sum all values
   
         cb(null, {
            allocated: 28,                            // not enough information for that, mock
            committed: used / total * 100
         });
      }
   });
   
};

var aggregateStorage = function (cb) {
  getInfoForAllHosts( "df/df-var-lib-nova-instances.rrd", ['ds[used].value', 'ds[free].value'], function (err, data) {
    if (err) {
      cb(err);
    } else {
      var total = data
         .map(function (e) { return e[1] + e[2] })
         .reduce(function(a, b) { return a + b });
        
      var used = data
         .map(function (e) { return e[1] })
         .reduce(function(a, b) { return a + b });
        
      cb(null, {
         allocated: 79,
         committed: used / total * 100
      });
    }
  });
};

var aggregateIPs = function (cb) {
   cb(null, {
      allocated: 95,
      committed: 88
   });
} 

/**
* Helper function. Wraps up function and passes all necessary arguments, 
* except for callbacks, which becomes the first argument of the new function.
* @func - function to wrap
* @args - array of arguments
*/
var wrap = function (func, args) {
   if (!args) { 
      args = []; 
   }
   
   return function () {
      return func.apply(this, args.concat(Array.prototype.slice.call(arguments)));
   }
}



// async.waterfall([
//    wrap(getInfoForAllHosts, ["load/load.rrd", ["ds[shortterm].value", "ds[midterm].value", "ds[longterm].value", "last_update"]]),
//    wrap(normalizeLoad, [[1,2,3]])
// ], function (err, data) {
//    var output = {
//       heatmap: data.map(function (e) { return [e[0], e[1], e[4]]; }),
//       average: {
//          shortterm: data
//             .map(function (e) { return e[1]; })
//             .reduce(function(a, b) { return a + b }) / data.length,
//          midterm: data
//             .map(function (e) { return e[2]; })
//             .reduce(function(a, b) { return a + b }) / data.length,
//          longterm: data
//             .map(function (e) { return e[3]; })
//             .reduce(function(a, b) { return a + b }) / data.length
//       }
//    };
//    console.log(err, output);
// });

// getInfoForAllHosts("load/load.rrd", 
//    ["ds[shortterm].value", "last_update"], 
//    function(err, data) {
//       if (err) {
//          console.log(err);
//       } else {
//          normalizeLoad(data, function (err, data) {
//             if (err) {
//                console.log(err);
//             } else {
//                console.log(data);
//             }
//          });
//       }
//    });


