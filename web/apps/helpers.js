/*global angular*/
'use strict';

angular.module('main')
  .value('helpers', {
    bytesToSize: function (bytes) {
      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'],
          i = 0;
      if (bytes !== 0) {
        i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
      }
      return { value: Math.round(bytes / Math.pow(1024, i), 2), multi: sizes[i] };
    },
    statusOf: function (type, value) {
      if (type === 'load') {
        if (value > 1) { return { status: 'warning', text: 'busy' }; }
        if (value > 0.7) { return { status: 'attention', text: 'warming' }; }
        return { status: 'normal' };
      } else if (type === 'network-errors') {
        return value ? { status: 'warning', text: 'errors' } : { status: 'normal' };
      } else {
        if (value > 95) { return { status: 'warning', text: 'run out' }; }
        if (value > 80) { return { status: 'attention', text: 'running out' }; }
        return { status: 'normal' };
      }
    }
  });