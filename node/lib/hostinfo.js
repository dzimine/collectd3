'use strict';

var _ = require('lodash')
  , async = require('async')
  , config = require('config')
  , fs = require('fs')
  , rrdhelpers = require('./rrdhelpers.js');

/**
 * Extract Load data of specific host.
 * @param host - name of the host to fetch
 * @return Set of shortterm, midterm, longterm and last_update
 */
var hostInfoLoad = function (host) {
  return _.partial(async.waterfall, [
    rrdhelpers.extract(host, "load/load.rrd", {
      shortterm: "ds[shortterm].last_ds",
      midterm: "ds[midterm].last_ds",
      longterm: "ds[longterm].last_ds",
      last_update: "last_update"
    }),
    rrdhelpers.normalizeLoad(['shortterm', 'midterm', 'longterm'], host)
  ]);
};

/**
 * Extract Memory data of specific host.
 * @param host - name of the host to fetch
 * @return Set of used, free, cached and buffered objects.
 *      Each of them consist of value and last_update.
 */
var hostInfoMemory = function (host) {
  return _.partial(async.parallel, {
    used: rrdhelpers.extract(host, "memory/memory-used.rrd", {
      value: "ds[value].last_ds",
      last_update: "last_update"
    }),
    free: rrdhelpers.extract(host, "memory/memory-free.rrd", {
      value: "ds[value].last_ds",
      last_update: "last_update"
    }),
    cached: rrdhelpers.extract(host, "memory/memory-cached.rrd", {
      value: "ds[value].last_ds",
      last_update: "last_update"
    }),
    buffered: rrdhelpers.extract(host, "memory/memory-buffered.rrd", {
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
  var type = _(config.client['node-types']).filter(function (e) {
    return host.match(e.host) && e.partition;
  }).value()[0] || { partition: '' };
  
  return rrdhelpers.extract(host, "df/df-" + type.partition + ".rrd", {
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
    var dir = config.server['data-directory'] + '/' + host;
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
            idle: rrdhelpers.extract(host, e + '/cpu-idle.rrd', {
              value: "ds[value].last_ds",
              last_update: "last_update"
            }),
            interrupt: rrdhelpers.extract(host, e + '/cpu-interrupt.rrd', {
              value: "ds[value].last_ds",
              last_update: "last_update"
            }),
            nice: rrdhelpers.extract(host, e + '/cpu-nice.rrd', {
              value: "ds[value].last_ds",
              last_update: "last_update"
            }),
            softirq: rrdhelpers.extract(host, e + '/cpu-softirq.rrd', {
              value: "ds[value].last_ds",
              last_update: "last_update"
            }),
            steal: rrdhelpers.extract(host, e + '/cpu-steal.rrd', {
              value: "ds[value].last_ds",
              last_update: "last_update"
            }),
            system: rrdhelpers.extract(host, e + '/cpu-system.rrd', {
              value: "ds[value].last_ds",
              last_update: "last_update"
            }),
            user: rrdhelpers.extract(host, e + '/cpu-user.rrd', {
              value: "ds[value].last_ds",
              last_update: "last_update"
            }),
            wait: rrdhelpers.extract(host, e + '/cpu-wait.rrd', {
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
 * Single Host Info Interface
 */

module.exports = function (req, res, next) {

  var host = req.params.id;

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