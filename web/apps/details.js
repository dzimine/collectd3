'use strict';

function DetailsCtrl($s, $http, $routeParams, bytesToSize, $filter) {

   $s.$routeParams = $routeParams;
   $s.bytesToSize = bytesToSize;

   $s.countByTemp = function (temp, vcpus) {
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
      return (vcpus || []).filter(levels[temp]).length;
   }

   $s.x=0;
   $s.useMock = false;
   $s.period = 'day';

   $s.tooltip = {};

   $s.showTooltip = function (time, load, memory) {
      $s.tooltip.text = $filter('date')(time*1000, 'EEE, MMM d HH:mm') + " | Load: " + load.toFixed(2)  + " | Memory: " + memory.toFixed(2) + '%';
      $s.$apply();
   }

   $s.hideTooltip = function (host, value) {
      $s.tooltip = {};
      $s.$apply();
   }

   $s.moveTooltip = function (x,y) {
      $s.tooltip.x = x;
      $s.tooltip.y = y;
      $s.$apply();
   }

   $s.fetch = function (){
      var t1 = new Date();
      // TODO: get the parameters from hour/3 hours/day/week/year selector
      var params = { period: $s.period };
      $s.context.status = "Loading..."

      var urlInfo = $s.useMock ? "/host-info.json" 
                : "/data/" + $routeParams.host + "/info";
      $http.get(urlInfo)
         .success(function (res) {
            $s.info = res;
            $s.context.status = "Done in " + (new Date() - t1) + " ms";
         })
         .error(function (err) {
            $s.info = {}
            $s.context.status = "Error getting data. Check the log.";
         });

      var urlGraph = $s.useMock ? "/graph.json" 
               : "/data/" + $routeParams.host + "/graph";
      $http.get(urlGraph, {params : params})
         .success(function(res) {
            $s.graph = res;
            $s.context.status = "Done in " + (new Date() - t1) + " ms";
         }).error(function(err) {
            $s.graph = {};
            $s.context.status = "Error getting data. Check the log.";
         });
        
   }

   $s.$watch('period', function () {
      $s.fetch();
   })


} DetailsCtrl.$inject = ['$scope', '$http', '$routeParams', 'bytesToSize', '$filter'];