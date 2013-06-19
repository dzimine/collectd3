'use strict';

function DetailsCtrl($s, $http, $routeParams, bytesToSize, $filter, countByTemp) {

   $s.$routeParams = $routeParams;
   $s.bytesToSize = bytesToSize;

   $s.countByTemp = countByTemp;

   $s.x=0;
   $s.useMock = false;
   $s.period = 'day';

   $s.tooltip = {};

   $s.showTooltip = function (time, load, memory, memoryUsed, memoryFree) {
      $s.tooltip.text = $filter('date')(time*1000, 'EEE, MMM d HH:mm');
      $s.tooltip.details = { 
         'Load': load.toFixed(2),
         'Memory': bytesToSize(memoryUsed).value + ' ' + bytesToSize(memoryUsed).multi + ' of ' + bytesToSize(memoryFree).value + ' ' + bytesToSize(memoryFree).multi + ' (' + memory.toFixed(2) + '%)'
      };
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

   $s.isEmptyObject = function (obj) {
      for (var key in obj) {
          if (hasOwnProperty.call(obj, key)) return false;
      }
      return true;
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


} DetailsCtrl.$inject = ['$scope', '$http', '$routeParams', 'bytesToSize', '$filter', 'countByTemp'];