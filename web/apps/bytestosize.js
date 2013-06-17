'use strict';

angular.module('main')
  .value('bytesToSize', function (bytes) {
      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'],
          i = 0;
      if (bytes != 0) {
         i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
      };
      return { value: Math.round(bytes / Math.pow(1024, i), 2), multi: sizes[i] };
   });