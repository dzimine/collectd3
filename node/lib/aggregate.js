'use strict';

var _ = require('lodash')
  , async = require('async')
  , rrdhelpers = require('./rrdhelpers.js');

/**
 * Aggregate Load info.
 * @return Set of average and peak parameters.
 */
var aggregateLoad = function (cb) {
  async.waterfall([
    rrdhelpers.extractAll("load/load.rrd", {
      shortterm: "ds[shortterm].last_ds",
      last_update: "last_update"
    }),
    rrdhelpers.normalizeLoad(['shortterm'])
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
    used: rrdhelpers.extractAll("memory/memory-used.rrd", {
      value: "ds[value].last_ds",
      last_update: "last_update"
    }),
    free: rrdhelpers.extractAll("memory/memory-free.rrd", {
      value: "ds[value].last_ds",
      last_update: "last_update"
    }),
    cached: rrdhelpers.extractAll("memory/memory-cached.rrd", {
      value: "ds[value].last_ds",
      last_update: "last_update"
    }),
    buffered: rrdhelpers.extractAll("memory/memory-buffered.rrd", {
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
  rrdhelpers.extractAll("df/df-var-lib-nova-instances.rrd", {
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
 * Aggregate Network info.
 * @return Set of average and peak octets per second.
 */
var aggregateNetwork = function (cb) {
  var period = {
    from: 1370557260,
    to: 1370643660,
    resolution: 86400
  };

  async.parallel({
    average: rrdhelpers.fetchAll("interface/if_octets-vlan11.rrd", "AVERAGE", period),
    peak: rrdhelpers.fetchAll("interface/if_octets-vlan11.rrd", "MAX", period),
    errors: rrdhelpers.fetchAll("interface/if_errors-vlan11.rrd", "MAX", period)
  }, function (err, data) {
    if (err) {
      cb(err);
    } else {
      var average = _(data.average).map(function (e) {
        return _(e).map(function (e) {
          return e.rx + e.tx;
        }).reduce(function (a, b) {
          return a + b;
        }) / e.length;
      }).reduce(function (a, b) {
        return a + b;
      }) / _.keys(data.average).length;

      var peak = _(data.peak).map(function (e) {
        return _(e).map(function (e) {
          return e.rx + e.tx;
        }).max().value();
      }).max().value();
      
      var errors = _(data.errors).map(function (e) {
        return _(e).map(function (e) {
          return e.rx + e.tx;
        }).max().value();
      }).max().value();

      cb(null, { average: average, peak: peak, errors: !!errors });
    }
  });
};

/**
 * Dashboard Info Interface
 */

module.exports = function (req, res, next) {
  async.parallel({
    load: aggregateLoad,
    memory: aggregateMemory,
    storage: aggregateStorage,
    network: aggregateNetwork
  }, function (err, data) {
    if (err) {
      next(err);
    } else {
      res.json(data);
    }
  });
};