'use strict';

angular.module('main')
   .value('countByTemp', function (temp, vcpus) {
      if (!vcpus) return;
      var levels = {
         hot: function (e) {
            return e.value > 0.8;
         },
         warm: function (e) {
            return e.value > 0.5 && e <= 0.8;
         },
         cold: function (e) {
            return e.value <= 0.5;
         }
      }
      return (vcpus || []).filter(levels[temp]).length;
   });