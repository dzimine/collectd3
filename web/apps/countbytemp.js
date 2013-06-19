'use strict';

angular.module('main')
   .value('countByTemp', function (temp, vcpus) {
      if (!vcpus) return;
      var levels = {
         hot: function (e) {
            return e > 0.8;
         },
         warm: function (e) {
            return e > 0.5 && e <= 0.8;
         },
         cold: function (e) {
            return e <= 0.5;
         }
      }
      if (angular.isArray(vcpus[0])) {
         vcpus = vcpus.map(function (e) { return e[1]; });
      }
      return (vcpus || []).filter(levels[temp]).length;
   });