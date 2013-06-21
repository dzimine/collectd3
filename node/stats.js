'use strict';

var fs = require('fs');
var execFile = require('child_process').execFile;
var async = require('async');
var rrd = require("rrd");
var rrdtool = "rrdtool";
var _ = require("lodash");

/******************************************************************************/
//  CONFIGURATION
//   The root of rrd data, collected by collectd
var collectDataRoot = __dirname + "/sampledata";


/******************************************************************************/

/**
 * Load Card Interface
 */

exports.getLoadInfo = function (req, res, next) {
   async.waterfall([
      getInfoForAllHosts("load/load.rrd", {
         shortterm: "ds[shortterm].last_ds",
         midterm: "ds[midterm].last_ds",
         longterm: "ds[longterm].last_ds",
         last_update: "last_update"
      }),
      normalizeLoad(['shortterm', 'midterm', 'longterm'])
   ], function (err, data) {
      if (err) {
         next(err);
      } else {
         var output = {
            heatmap: _(data).map(function (e, i) {
               return { key: i, value: e.shortterm };
            }).sortBy(function (e) {
               return e.key;
            }).value(),
            average: {
               shortterm: _(data)
                  .map(function (e) { return e.shortterm; })
                  .reduce(function (a, b) { return a + b; }) / _.keys(data).length,

               midterm: _(data)
                  .map(function (e) { return e.midterm; })
                  .reduce(function (a, b) { return a + b; }) / _.keys(data).length,

               longterm: _(data)
                  .map(function (e) { return e.longterm; })
                  .reduce(function (a, b) { return a + b; }) / _.keys(data).length
            }
         };
         res.json(output);
      }
   });
};

/**
 * Memory Card Interface
 */

exports.getMemoryInfo = function (req, res, next) {
   async.parallel({
      used: getInfoForAllHosts("memory/memory-used.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      }),
      free: getInfoForAllHosts("memory/memory-free.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      }),
      cached: getInfoForAllHosts("memory/memory-cached.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      }),
      buffered: getInfoForAllHosts("memory/memory-buffered.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      })
   }, function (err, data) {
      if (err) {
         next(err);
      } else {
         var hash = {};

         _(data).each(function (value, type) {
            _(value).each(function (e, host) {
               hash[host] = hash[host] || {};
               hash[host][type] = e.value;
            });
         });

         res.json({
            heatmap: _(hash).map(function (value, key) {
               return {
                  key: key,
                  value: value.used / (value.used + value.free),
                  details: {
                     used: value.used,
                     free: value.free
                  }
               };
            }).sortBy(function (e) {
               return e.key;
            }).value()
         });
      }
   });
};

/**
 * Dashboard Info Interface
 */

exports.getAggregateInfo = function (req, res, next) {
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
};

/**
 * Aggregate Load info.
 * @return Set of average and peak parameters.
 */
var aggregateLoad = function (cb) {
   async.waterfall([
      getInfoForAllHosts("load/load.rrd", {
         shortterm: "ds[shortterm].last_ds",
         last_update: "last_update"
      }),
      normalizeLoad(['shortterm'])
   ], function (err, data) {
      if (err) {
         cb(err);
      } else {
         var load = _.map(data, function (e) { return e.shortterm; });
         var sum = _.reduce(load, function (a, b) { return a + b; });
         var ave = sum / load.length;
         var max = Math.max.apply(this, load);
         
         cb(null, { average: ave, peak: max });
      }
   });
};

/**
 * Aggregate Memory info.
 * @return Set of allocated and committed parameters.
 */
var aggregateMemory = function (cb) {
   async.parallel({
      used: getInfoForAllHosts("memory/memory-used.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      }),
      free: getInfoForAllHosts("memory/memory-free.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      }),
      cached: getInfoForAllHosts("memory/memory-cached.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      }),
      buffered: getInfoForAllHosts("memory/memory-buffered.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      })
   }, function (err, data) {
      if (err) {
         cb(err);
      } else {
         var hash = {};

         _(data).each(function (value, type) {
            _(value).each(function (e, host) {
               hash[host] = hash[host] || {};
               hash[host][type] = e.value;
            });
         });

         var total = _(hash)
            .map(function (e) { return e.used + e.free + e.cached + e.buffered; })
            .reduce(function (a, b) { return a + b; });

         var used = _(hash)
            .map(function (e) { return e.used; })
            .reduce(function (a, b) { return a + b; });

         cb(null, {
            allocated: 28,
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
   getInfoForAllHosts("df/df-var-lib-nova-instances.rrd", {
      used: 'ds[used].last_ds',
      free: 'ds[free].last_ds'
   })(function (err, data) {
      if (err) {
         cb(err);
      } else {
         var total = _(data)
            .map(function (e) { return e.used + e.free; })
            .reduce(function (a, b) { return a + b; });

         var used = _(data)
            .map(function (e) { return e.used; })
            .reduce(function (a, b) { return a + b; });

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
};

/**
 * Single Host Info Interface
 */

exports.getHostInfo = function (req, res, next) {

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
};

/**
 * Extract Load data of specific host.
 * @param host - name of the host to fetch
 * @return Set of shortterm, midterm, longterm and last_update
 */
var hostInfoLoad = function (host) {
   return _.partial(async.waterfall, [
      extractRRD(host, "load/load.rrd", {
         shortterm: "ds[shortterm].last_ds",
         midterm: "ds[midterm].last_ds",
         longterm: "ds[longterm].last_ds",
         last_update: "last_update"
      }),
      normalizeLoad(['shortterm', 'midterm', 'longterm'], host)
   ]);
};

/**
 * Extract Memory data of specific host.
 * @param host - name of the host to fetch
 * @return Set of used, free, cached and buffered objects.
 *         Each of them consist of value and last_update.
 */
var hostInfoMemory = function (host) {
   return _.partial(async.parallel, {
      used: extractRRD(host, "memory/memory-used.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      }),
      free: extractRRD(host, "memory/memory-free.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      }),
      cached: extractRRD(host, "memory/memory-cached.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      }),
      buffered: extractRRD(host, "memory/memory-buffered.rrd", {
         value: "ds[value].last_ds",
         last_update: "last_update"
      })
   });
};

/**
 * Extract Storage data of specific host.
 * @param host - name of the host to fetch
 * @return Set of used, free and last_update
 */
var hostInfoStorage = function (host) {
   return extractRRD(host, "df/df-var-lib-nova-instances.rrd", {
      used: 'ds[used].last_ds',
      free: 'ds[free].last_ds',
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
      var dir = collectDataRoot + '/' + host;
      var str = "cpu-";

      fs.readdir(dir, function (err, filenames) {
         if (err) {
            cb(err);
         } else {
            var listCpus = filenames.filter(function (e) {
               return e.slice(0, str.length) === str;
            });

            async.parallel(_.map(listCpus, function (e) {
               return _.partial(async.parallel, {
                  idle: extractRRD(host, e + '/cpu-idle.rrd', {
                     value: "ds[value].last_ds",
                     last_update: "last_update"
                  }),
                  interrupt: extractRRD(host, e + '/cpu-interrupt.rrd', {
                     value: "ds[value].last_ds",
                     last_update: "last_update"
                  }),
                  nice: extractRRD(host, e + '/cpu-nice.rrd', {
                     value: "ds[value].last_ds",
                     last_update: "last_update"
                  }),
                  softirq: extractRRD(host, e + '/cpu-softirq.rrd', {
                     value: "ds[value].last_ds",
                     last_update: "last_update"
                  }),
                  steal: extractRRD(host, e + '/cpu-steal.rrd', {
                     value: "ds[value].last_ds",
                     last_update: "last_update"
                  }),
                  system: extractRRD(host, e + '/cpu-system.rrd', {
                     value: "ds[value].last_ds",
                     last_update: "last_update"
                  }),
                  user: extractRRD(host, e + '/cpu-user.rrd', {
                     value: "ds[value].last_ds",
                     last_update: "last_update"
                  }),
                  wait: extractRRD(host, e + '/cpu-wait.rrd', {
                     value: "ds[value].last_ds",
                     last_update: "last_update"
                  })
               });
            }), function (err, data) {
               cb(err, _.map(data, function (e) {
                  var total = _(_.keys(e))
                     .map(function (k) { return e[k].value; })
                     .reduce(function (a, b) { return a + b; });

                  return { value: 1 - (e.idle.value / total) };
               }));
            });
         }
      });
   };
};

/**
 * Single Host Graph Interface
 */

exports.getHostGraph = function (req, res, next) {
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
         resolution: 3600
      },
      month: {
         from: 1367965260,
         to: 1370643660,
         resolution: 43200
      }
   }[req.query.period || 'day'];

   async.parallel({
      load: hostGraphLoad(host, query),
      memory: hostGraphMemory(host, query),
      storage: hostGraphStorage(host, query)
   }, function (err, data) {
      if (err) {
         next(err);
      } else {
         res.json(data);
      }
   });
};

/**
 * Fetch Load graph data of specific host.
 * @param host - name of the host to fetch
 * @param query - set of request parameters (from, to, r)
 * @return Array of [ time, load ]
 */
var hostGraphLoad = function (host, query) {
   return function (cb) {
      fetchRRD(host, "load/load.rrd", "MAX", query)(function (err, data) {
         cb(err, data.shortterm);
      });
   };
};

/**
 * Fetch Memory graph data of specific host.
 * @param host - name of the host to fetch
 * @param query - set of request parameters (from, to, r)
 * @return Array of [ time, %used ]
 */
var hostGraphMemory = function (host, query) {
   return function (cb) {
      async.parallel({
         used: fetchRRD(host, "memory/memory-used.rrd", "AVERAGE", query),
         free: fetchRRD(host, "memory/memory-free.rrd", "AVERAGE", query),
         buffered: fetchRRD(host, "memory/memory-buffered.rrd", "AVERAGE", query),
         cached: fetchRRD(host, "memory/memory-cached.rrd", "AVERAGE", query)
      }, function (err, data) {
         var results = _.map(data.used.value, function (e, i) {
            var total = data.used.value[i][1] + data.free.value[i][1];
                      // + data.buffered.value[i][1] + data.cached.value[i][1];
            return [
               data.used.value[i][0],              // timestamp
               data.used.value[i][1] / total * 100,
               data.used.value[i][1],
               data.free.value[i][1] // percentage used
            ];
         });

         cb(err, results);
      });
   };
};

/**
 * Fetch Storage graph data of specific host.
 * @param host - name of the host to fetch
 * @param query - set of request parameters (from, to, r)
 * @return Array of [ time, %used ]
 */
var hostGraphStorage = function (host, query) {
   return function (cb) {
      fetchRRD(host, "df/df-var-lib-nova-instances.rrd", "AVERAGE", query)(function (err, data) {
         if (err) {
            cb(null, null); // do not throw an error when there is no file to parse
         } else {
            var results = _.map(data.used, function (e, i) {
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
var fetchRRD = function (host, rrd_file, cf, query) {
   return function (callback) {
      var rrd_file_path = collectDataRoot + "/" + host + "/" + rrd_file;
      var params = [];
      //TODO: set good defaults to avoid buffer overflow
      if (query.from) { params.push("--start", query.from); }
      if (query.to) { params.push("--end", query.to); }
      if (query.resolution) { params.push("-r", query.resolution); }

      var args = ["fetch", rrd_file_path, cf].concat(params);
      console.log("Running: ", rrdtool, args.join(" "));

      execFile(rrdtool, args, function (err, data) {
         if (err) {
            callback(err);
         } else {
            // split by lines
            var lines = data.split('\n');

            // parse out the keys from the header line
            var keys = lines[0].split(/[\s,]+/).splice(1);

            // create d3 friendly output data structure
            var res = {};
            for (var k = 0; k < keys.length; k++) {
               res[keys[k]] = [];
            }

            // Loop lines and fill up the data points
            // TODO: figure better way to handle [nan, nan, nan]?
            // For now: assuming that 1) last line is empty, 2) the prev is time [nan,nan,nan...]
            for (var i = 2; i < (lines.length - 2); i++) {
               var s1 = lines[i].split(/:\s+/);
               var t = s1[0];
               if (s1[1] === null) {
                  continue;
               }
               var values = s1[1].split(/\s+/);
               for (var v = 0; v < values.length; v++) {
                  res[keys[v]].push([parseInt(t, 10), parseFloat(values[v].split(',').join('.'))]);
               }
            }
            callback(null, res);
         }
      });
   };
};

/**
 * Async-compatible wrapper around infoRRD to extract only specific set of keys.
 * @param host - name of host to extract
 * @param file - relative path to the .rrd file in collectd structure
 * @param keys - set of keys to extract
 */
var extractRRD = function (host, file, keys) {
   return function (cb) {
      var rrd_file_path = collectDataRoot + "/" + host + "/" + file;
      rrd.info(rrd_file_path, function (info) {
         var data = {};

         _(keys).each(function (e, key) {
            if (info.hasOwnProperty(e)) {
               data[key] = parseFloat(info[e]);
            }
         });
         cb(null, data);
      });
   };
};

/**
* Iterates all 'host' folders under collectd data root, and calls info on the specified
* rrd file, and returns an array of results [{host:hostname,info:data}...]
* @param path - path to the .rrd file in collectd structure, relative to "host" directory
* @param info - list of rrd info keys which we need values for
* @param callback(err, data) - calls with (err, null) on error, and (null, data)
* where data is an array of info outputs.
*/
var getInfoForAllHosts = function (path, keys) {
   return function (callback) {
      var local = {
         readHostsDirectory: _.partial(fs.readdir, collectDataRoot),

         filterDirectories: function (hosts, cb) {
            async.filter(hosts, function (host, callback) {
               fs.stat([collectDataRoot, host].join("/"), function (err, stat) {
                  callback(!stat.isFile());
               });
            }, function (data) {
               cb(null, data);
            });
         },

         filterFileExist: function (hosts, cb) {
            async.filter(hosts, function (host, callback) {
               fs.exists([collectDataRoot, host, path].join("/"), callback);
            }, function (data) {
               cb(null, data);
            });
         }
      };
   
      async.waterfall([
         _.partial(async.waterfall, [
            local.readHostsDirectory,
            local.filterDirectories,
            local.filterFileExist
         ]),
         function (hosts, cb) {
            async.parallel(_.zipObject(hosts, _.map(hosts, function (host) {
               return extractRRD(host, path, keys);
            })), cb);
         }
      ], callback);
   };
};

/**
* Normalizes Load Average based on a number of cores.
* @param cols - array of indices of columns to normalize
* @param data - array of data to normalize
* @param callback - calls with (err, null) on error, and (null, data)
* where data is an array of info outputs.
*/
var normalizeLoad = function (cols, host) {
   return function (data, callback) {
      cols = cols || [1];
      
      if (host) {
         var o = {};
         o[host] = data;
         data = o;
      }

      async.each(_.keys(data), function (host, cb) {
         var dir = collectDataRoot + '/' + host;
         var str = "cpu-";
         
         fs.readdir(dir, function (err, filenames) {
            if (err) {
               cb(err);
            } else {
               var numberOfCpus = _.filter(filenames, function (e) {
                  return e.slice(0, str.length) === str;
               }).length;
               _(cols).each(function (i) { data[host][i] = data[host][i] / numberOfCpus; });
               cb();
            }
         });
      }, function (err) {
         callback(err, host ? data[host] : data);
      });
   };
};