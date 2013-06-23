'use strict';

var _ = require('lodash')
  , async = require('async')
  , config = require('config').server
  , fs = require('fs')
  , execFile = require('child_process').execFile
  , rrd = require("rrd")
  , rrdtool = "rrdtool";

/**
 * fetchRRD: Calls rrdtool and returns the data.
 * @param host - name of the host to fetch
 * @param rrd_file - relative path to rrd file config['data-directory']/{host_id}
 * @param cf - RRD Config Function (AVERAGE, MIN, MAX, LAST)
 * @param query - set of request parameters (from, to, r)
 *
 * Note: it uses execFile, thus will throw if rdtool output result > 200Mb
 * If the buffer is bigger, one can switch to spawn,
 * but think again: why returning big data to the client?
 */
var fetch = function (host, rrd_file, cf, query) {
  return function (callback) {
    var rrd_file_path = [config['data-directory'], host, rrd_file].join('/');
    var params = [];
    //TODO: set good defaults to avoid buffer overflow
    if (query.from) { params.push("--start", query.from); }
    if (query.to) { params.push("--end", query.to); }
    if (query.resolution) { params.push("-r", query.resolution); }

    var args = ["fetch", rrd_file_path, cf].concat(params);
    if (config['log-info']) {
      console.info("Running: ", rrdtool, args.join(" "));
    }

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
var extract = function (host, file, keys) {
  return function (cb) {
    var rrd_file_path = [config['data-directory'], host, file].join('/');
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
var extractAll = function (path, keys) {
  return function (callback) {
    var local = {
      readHostsDirectory: _.partial(fs.readdir, config['data-directory']),

      filterDirectories: function (hosts, cb) {
        async.filter(hosts, function (host, callback) {
          fs.stat([config['data-directory'], host].join("/"), function (err, stat) {
            callback(!stat.isFile());
          });
        }, function (data) {
          cb(null, data);
        });
      },

      filterFileExist: function (hosts, cb) {
        async.filter(hosts, function (host, callback) {
          fs.exists([config['data-directory'], host, path].join("/"), callback);
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
          return extract(host, path, keys);
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
      var dir = [config['data-directory'], host].join('/');
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

module.exports = { fetch: fetch
                 , extract: extract
                 , extractAll: extractAll
                 , normalizeLoad: normalizeLoad
                 };