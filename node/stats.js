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

/**
 * Load Card Interface
 */

var getLoadInfo = exports.getLoadInfo = function(req, res, next) {
   async.waterfall([
      wrap(getInfoForAllHosts, ["load/load.rrd", [
         "ds[shortterm].value", 
         "ds[midterm].value", 
         "ds[longterm].value", 
         "last_update"
      ]]),
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

/**
 * Memory Card Interface
 */

var getMemoryHeatmap = exports.getMemoryHeatmap = function(req, res, next) {
   async.parallel({
      used: wrap(getInfoForAllHosts, ["memory/memory-used.rrd", [
         "ds[value].value", 
         "last_update"
      ]]),
      free: wrap(getInfoForAllHosts, ["memory/memory-free.rrd", [
         "ds[value].value", 
         "last_update"
      ]]),
      cached: wrap(getInfoForAllHosts, ["memory/memory-cached.rrd", [
         "ds[value].value", 
         "last_update"
      ]]),
      buffered: wrap(getInfoForAllHosts, ["memory/memory-buffered.rrd", [
         "ds[value].value", 
         "last_update"
      ]])
   }, function (err, data) {
      if (err) {
         cb(err)
      } else {
         var hash = {},
             result = []

         data.used.forEach(function (e) { 
            hash[e[0]] = hash[e[0]] || {};
            hash[e[0]].used = e[1]; 
         });
         data.free.forEach(function (e) { 
            hash[e[0]] = hash[e[0]] || {};
            hash[e[0]].free = e[1]; 
         });

         for (var key in hash) {
            result.push({ 
               key: key, 
               value: hash[key].used / (hash[key].used + hash[key].free),
               details: {
                  used: hash[key].used,
                  free: hash[key].free
               }
            });
         }

         var output = { heatmap:result };
         res.json(output);
      }
   });
}

/**
 * Dashboard Info Interface
 */

var getAggregateInfo = exports.getAggregateInfo = function (req, res, next) {
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
 * Aggregate Load info.
 * @return Set of average and peak parameters.
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

/**
 * Aggregate Memory info.
 * @return Set of allocated and committed parameters.
 */
var aggregateMemory = function (cb) {
   async.parallel([
      wrap(getInfoForAllHosts, ["memory/memory-used.rrd", [
         "ds[value].value", 
         "last_update"
      ]]),
      wrap(getInfoForAllHosts, ["memory/memory-free.rrd", [
         "ds[value].value", 
         "last_update"
      ]]),
      wrap(getInfoForAllHosts, ["memory/memory-cached.rrd", [
         "ds[value].value", 
         "last_update"
      ]]),
      wrap(getInfoForAllHosts, ["memory/memory-buffered.rrd", [
         "ds[value].value", 
         "last_update"
      ]])
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

/**
 * Aggregate Storage info.
 * @return Set of allocated and committed parameters.
 */
var aggregateStorage = function (cb) {
   getInfoForAllHosts( "df/df-var-lib-nova-instances.rrd", [
      'ds[used].value', 
      'ds[free].value'
   ], function (err, data) {
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

/**
 * Aggregate IP info.
 * @return Set of allocated and committed parameters.
 */
var aggregateIPs = function (cb) {
   cb(null, {
      allocated: 95,
      committed: 88
   });
} 

/**
 * Single Host Info Interface
 */

var getHostInfo = exports.getHostInfo = function (req, res, next) {
   
   var host = req.route.params.id;
   
   async.parallel({
      load: hostInfoLoad(host),
      memory: hostInfoMemory(host),
      storage: hostInfoStorage(host),
      vcpu: hostInfoVcpu(host)
   }, function (err, data) {
      if (err) {
         next(err);
      } else {
         res.json(data);
      }
   });
}

/**
 * Extract Load data of specific host.
 * @param host - name of the host to fetch
 * @return Set of shortterm, midterm, longterm and last_update
 */
var hostInfoLoad = function (host) {
   return function (cb) {
      async.waterfall([
         extractRRD(host, "load/load.rrd", {
            shortterm: "ds[shortterm].value", 
            midterm: "ds[midterm].value", 
            longterm: "ds[longterm].value", 
            last_update: "last_update"
         }),
         // KI: Quite unpleasant workaround. Haven't figured out a way to overcome few 
         // bad design decisions we made earlier.
         function (data, cb) {
            cb(null, [[
               host, 
               data.shortterm, 
               data.midterm, 
               data.longterm, 
               data.last_update
            ]]);
         },
         wrap(normalizeLoad, [[1,2,3]])
      ], function (err, data) {
         cb(null, {
            shortterm: data[0][1],
            midterm: data[0][2],
            longterm: data[0][3],
            last_update: data[0][4]
         });
      });
   };
};

/**
 * Extract Memory data of specific host.
 * @param host - name of the host to fetch
 * @return Set of used, free, cached and buffered objects. 
 *         Each of them consist of value and last_update.
 */
var hostInfoMemory = function (host) {
   return function (cb) {
      async.parallel({
         used: extractRRD(host, "memory/memory-used.rrd", {
            value: "ds[value].value", 
            last_update: "last_update"
         }),
         free: extractRRD(host, "memory/memory-free.rrd", {
            value: "ds[value].value", 
            last_update: "last_update"
         }),
         cached: extractRRD(host, "memory/memory-cached.rrd", {
            value: "ds[value].value", 
            last_update: "last_update"
         }),
         buffered: extractRRD(host, "memory/memory-buffered.rrd", {
            value: "ds[value].value", 
            last_update: "last_update"
         })
      }, cb);
   };
};

/**
 * Extract Storage data of specific host.
 * @param host - name of the host to fetch
 * @return Set of used, free and last_update
 */
var hostInfoStorage = function (host) {
   return extractRRD(host, "df/df-var-lib-nova-instances.rrd", {
      used: 'ds[used].value', 
      free: 'ds[free].value',
      last_update: 'last_update'
   });
};

/**
 * Extract VCPU data of specific host.
 * @param host - name of the host to fetch
 * @return Array of %used for each VCPU
 */
var hostInfoVcpu = function (host) {
   return function (cb) {
      var dir = collectDataRoot + '/' + host
      var str = "cpu-";

      fs.readdir(dir, function (err, filenames) {
         if (err) {
            cb(err);
         } else {
            var listCpus = filenames.filter(function (e) { 
               return e.slice(0, str.length) === str;
            });

            async.parallel(listCpus.map(function (e) {
               return wrap(async.parallel, [{
                  idle: extractRRD(host, e + '/cpu-idle.rrd', {
                     value: "ds[value].value",
                     last_update: "last_update"
                  }),
                  interrupt: extractRRD(host, e + '/cpu-interrupt.rrd', {
                     value: "ds[value].value",
                     last_update: "last_update"
                  }),
                  nice: extractRRD(host, e + '/cpu-nice.rrd', {
                     value: "ds[value].value",
                     last_update: "last_update"
                  }),
                  softirq: extractRRD(host, e + '/cpu-softirq.rrd', {
                     value: "ds[value].value",
                     last_update: "last_update"
                  }),
                  steal: extractRRD(host, e + '/cpu-steal.rrd', {
                     value: "ds[value].value",
                     last_update: "last_update"
                  }),
                  system: extractRRD(host, e + '/cpu-system.rrd', {
                     value: "ds[value].value",
                     last_update: "last_update"
                  }),
                  user: extractRRD(host, e + '/cpu-user.rrd', {
                     value: "ds[value].value",
                     last_update: "last_update"
                  }),
                  wait: extractRRD(host, e + '/cpu-wait.rrd', {
                     value: "ds[value].value",
                     last_update: "last_update"
                  })
               }]);
            }), function (err, data) {
               cb(err, data.map(function (e) {
                  var total = Object.keys(e)
                     .map(function (k) { return e[k].value; })
                     .reduce(function(a, b) { return a + b });
                  
                  return (1 - (e.idle.value / total)) * 100;
               }));
            })
         }
      });
   };
};

/**
 * Single Host Graph Interface
 */

var getHostGraph = exports.getHostGraph = function (req, res, next) {
   var host = req.params.id;
   
   var query = {
      day: {
         from: 1370557260,
         to: 1370643660,
         resolution: 300
      },
      week: {
         from: 1370038860,
         to: 1370643660, 
         resolution: 3600,
      },
      month: {
         from: 1367965260,
         to: 1370643660, 
         resolution: 43200,
      }
   }[ req.query.period || 'day' ];
   
   async.parallel({
      load: hostGraphLoad(host, query),
      memory: hostGraphMemory(host, query),
      storage: hostGraphStorage(host, query)
   }, function (err, data) {
      if (err) {
         next(err);
      } else {
         res.json(data)
      }
   })
}

/**
 * Fetch Load graph data of specific host.
 * @param host - name of the host to fetch
 * @param query - set of request parameters (from, to, r)
 * @return Array of [ time, load ]
 */
var hostGraphLoad = function (host, query) {
   return function (cb) {
      fetchRRD(host, "load/load.rrd", "MAX", query, function (err, data) {
         cb(err, data.shortterm );
      });
   };
}

/**
 * Fetch Memory graph data of specific host.
 * @param host - name of the host to fetch
 * @param query - set of request parameters (from, to, r)
 * @return Array of [ time, %used ]
 */
var hostGraphMemory = function (host, query) {
   return function (cb) {
      async.parallel({
         used: wrap(fetchRRD, [host, "memory/memory-used.rrd", "AVERAGE", query]),
         free: wrap(fetchRRD, [host, "memory/memory-free.rrd", "AVERAGE", query]),
         buffered: wrap(fetchRRD, [host, "memory/memory-buffered.rrd", "AVERAGE", query]),
         cached: wrap(fetchRRD, [host, "memory/memory-cached.rrd", "AVERAGE", query])
      }, function (err, data) {
         var results = data.used.value.map(function (e, i) {
            var total = data.used.value[i][1] + data.free.value[i][1];
                      // + data.buffered.value[i][1] + data.cached.value[i][1];
            return [ 
               data.used.value[i][0],              // timestamp
               data.used.value[i][1] / total * 100 // percentage used
            ]; 
         });
   
         cb(err, results);
      });
   };
}

/**
 * Fetch Storage graph data of specific host.
 * @param host - name of the host to fetch
 * @param query - set of request parameters (from, to, r)
 * @return Array of [ time, %used ]
 */
var hostGraphStorage = function (host, query) {
   return function (cb) {
      fetchRRD(host, "df/df-var-lib-nova-instances.rrd", "AVERAGE", query, function (err, data) {
         if (err) {
            cb(null, null); // do not throw an error when there is no file to parse
         } else {
            var results = data.used.map(function (e, i) {
               var total = data.used[i][1] + data.free[i][1];

               return [
                  data.used[i][0],              // timestamp
                  data.used[i][1] / total * 100 // percentage used
               ];
            });

            cb(err, results);
         }
      });
   };
};

/**
 * Helpers
 */

/**
 * fetchRRD: Calls rrdtool and returns the data.
 * @param host - name of the host to fetch
 * @param rrd_file - relative path to rrd file collectDataRoot/{host_id} 
 * @param cf - RRD Config Function (AVERAGE, MIN, MAX, LAST) 
 * @param query - set of request parameters (from, to, r)
 * 
 * Note: it uses execFile, thus will throw if rdtool output result > 200Mb
 * If the buffer is bigger, one can switch to spawn, 
 * but think again: why returning big data to the client?
 */
var fetchRRD = function (host, rrd_file, cf, query, callback) {

   var rrd_file_path = collectDataRoot + "/" + host + "/" + rrd_file;
   var params = [];
   //TODO: set good defaults to avoid buffer overflow
   if (query.from) { params.push("--start", query.from); }
   if (query.to) { params.push("--end", query.to); }
   if (query.resolution) { params.push("-r", query.resolution); }
  
   var args = ["fetch", rrd_file_path, cf].concat(params);
   console.log("Running: ", rrdtool, args.join(" "));      

   var child = execFile(rrdtool, args, function(err, stdout, stderr) {
          if (err) {
            callback(err);
         } else { 
            callback(null, formatOutput(stdout));
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
 * Async-compatible wrapper around infoRRD to extract only specific set of keys.
 * @param host - name of host to extract
 * @param file - relative path to the .rrd file in collectd structure
 * @param keys - set of keys to extract
 */
var extractRRD = function (host, file, keys) {
   return function (cb) {
      infoRRD(file, host, function(info) {
         var data = {};

         Object.keys(keys).forEach(function(key, i) {
            if (info.hasOwnProperty(keys[key])) {
               data[key] = info[keys[key]];
            }
         });
         cb(null, data);
      });
   };
};

/**
*  Takes rrdtool outpoot and transforms it to d3 data
*  rrdtool output: time: value[0],value[1],value[2]... (see output.txt for a sample)
*  d3 data [{key:key, value[]}...] (see d3 or nvd3 samples)
*/
var formatOutput = function (data) {
   // split by lines
   var lines = data.split('\n');
   // parse out the keys from the header line
   var keys = lines[0].split(/[\s,]+/).splice(1);
   // create d3 friendly output data structure
   var res = {};
   for (var k=0; k< keys.length; k++) {
      res[keys[k]] = [];
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
         res[keys[v]].push([ parseInt(t), parseFloat(values[v].split(',').join('.')) ]);
      }
   }
   return res;
};

/**
* Iterates all 'host' folders under collectd data root, and calls info on the specified 
* rrd file, and returns an array of results [{host:hostname,info:data}...]
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
   
   async.each(data, function (host, cb) {
      var dir = collectDataRoot + '/' + host[0]
      var str = "cpu-";
      
      fs.readdir(dir, function (err, filenames) {
         if (err) {
            cb(err);
         } else {
            var numberOfCpus = filenames.filter(function (e) { 
               return e.slice(0, str.length) === str;
            }).length;
            cols.forEach(function (i) { host[i] = host[i] / numberOfCpus });
            cb();
         }
      });
   }, function (err) {
      callback(err, data)
   });
};

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