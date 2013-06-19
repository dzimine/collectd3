'use strict';

function DetailsCtrl($s, $http, $routeParams, bytesToSize) {

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

   $s.fetch = function (){
      var t1 = new Date();
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
            var i = $s.graph["load"].length - 1;
            $s.timelineSelect(i);
            $s.context.status = "Done in " + (new Date() - t1) + " ms";
         }).error(function(err) {
            $s.graph = {};
            $s.context.status = "Error getting data. Check the log.";
         });
        
   }

   //TODO: this is a hack: it shall be in the directive. Don't want to see "load" and "memory" here.
   $s.timelineSelect = function (i) {
      $s.loadSelected = $s.graph["load"][i];
      $s.memorySelected = $s.graph["memory"][i];
      //$s.$apply(); //$apply needed because it's not a handler for an angular event
   }

   $s.$watch('period', function () {
      $s.fetch();
   })


} DetailsCtrl.$inject = ['$scope', '$http', '$routeParams', 'bytesToSize'];