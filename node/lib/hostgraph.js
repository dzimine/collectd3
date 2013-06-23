'use strict';

var _ = require('lodash')
  , async = require('async')
  , rrdhelpers = require('./rrdhelpers.js');

/**
 * Single Host Graph Interface
 */

module.exports = function (req, res, next) {
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
    rrdhelpers.fetch(host, "load/load.rrd", "MAX", query)(function (err, data) {
      cb(err, _.map(data, function (e) {
        return [e._time, e.shortterm];
      }));
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
      used: rrdhelpers.fetch(host, "memory/memory-used.rrd", "AVERAGE", query),
      free: rrdhelpers.fetch(host, "memory/memory-free.rrd", "AVERAGE", query),
      buffered: rrdhelpers.fetch(host, "memory/memory-buffered.rrd", "AVERAGE", query),
      cached: rrdhelpers.fetch(host, "memory/memory-cached.rrd", "AVERAGE", query)
    }, function (err, data) {
      var results = _.map(data.used, function (e, i) {
        var total = data.used[i].value + data.free[i].value +
                data.buffered[i].value + data.cached[i].value;
        return [
          data.used[i]._time, // timestamp
          data.used[i].value / total * 100,
          data.used[i].value,
          data.free[i].value // percentage used
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
    rrdhelpers.fetch(host, "df/df-var-lib-nova-instances.rrd", "AVERAGE", query)(function (err, data) {
      if (err) {
        cb(null, null); // do not throw an error when there is no file to parse
      } else {
        var results = _.map(data, function (e, i) {
          var total = data[i].used + data[i].free;

          return [
            data[i]._time,          // timestamp
            data[i].used / total * 100 // percentage used
          ];
        });

        cb(err, results);
      }
    });
  };
};