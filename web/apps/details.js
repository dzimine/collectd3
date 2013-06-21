'use strict';

function DetailsCtrl($s, $http, $routeParams, bytesToSize, $filter, countByTemp, $log) {

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
         'Load': load ? load.toFixed(2) : "?" ,
         'Memory used': memory ? bytesToSize(memoryUsed).value + ' ' + bytesToSize(memoryUsed).multi : "?",
         'Memory free': memory ? bytesToSize(memoryFree).value + ' ' + bytesToSize(memoryFree).multi : "?",
         'Memory %': memory ? memory.toFixed(2) : "?"
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

   $s.fetch = function (){
      // TODO: get the parameters from hour/3 hours/day/week/year selector
      var params = { period: $s.period };
      $log.time("Loading details data");

      var urlInfo = $s.useMock ? "/host-info.json" 
                : "/data/" + $routeParams.host + "/info";
      $http.get(urlInfo)
         .success(function (res) {
            $s.info = res;
            $log.time("Info data loaded");
         })
         .error(function (err) {
            $s.info = {}
            $log.time("Info data failed");
         });

      var urlGraph = $s.useMock ? "/graph.json" 
               : "/data/" + $routeParams.host + "/graph";
      $http.get(urlGraph, {params : params})
         .success(function(res) {
            $s.graph = res;
            $log.time("Graph data loaded");
         }).error(function(err) {
            $s.graph = {};
            $log.time("Graph data failed");
         });
        
   }

   $s.$watch('period', function () {
      $log.resetTime();
      $s.fetch();
   })


} DetailsCtrl.$inject = ['$scope', '$http', '$routeParams', 'bytesToSize', '$filter', 'countByTemp', '$log'];