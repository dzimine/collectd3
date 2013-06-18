/*jshint globalstrict:true, jquery:true, browser:true */
/*global d3*/
'use strict';

function DashboardCtrl($s, $http, $location, statusOf) {

   var tab = '',
       minWidth = 800; // minimal width to maintain default cell size
   
   $s.switchCard = function (name) {
      tab = name;
   };
   
   $s.isCard = function (name) {
      var current = tab;
      if (current === '' && name === "load") {
         return true;
      }
      return current === name;
   }
   
   $s.statusOf = statusOf;
   
   $s.tooltip = {};
   
   $s.moveTo = function (host) {
      $location.path('/details/' + host);
      $s.$apply();
   }
   
   $s.showTooltip = function (host, value) {
      $s.tooltip.text = "Host ID: " + host + " | Load Average: " + value.toFixed(2);
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

   $s.fetch = function(){
      var t1 = new Date();
      $s.context.status = "Loading...";

      $http.get("/data/load")
         .success(function(res) {
            $s.load = res;
            $s.context.status = "Done in " + (new Date() - t1) + " ms";
         }).error(function(err) {
            $s.load = {};
            $s.context.status = "Error getting data. Check the log.";
         });
         
      $http.get("/data/aggregate")
         .success(function(res) {
            $s.aggregate = res;
            $s.status = "Done in " + (new Date() - t1) + " ms";
         }).error(function(err) {
            $s.aggregate = {};
            $s.context.status = "Error getting data. Check the log.";
         });
   };
   
   $s.fetch();
   
   $(window).resize(function() {
      render();
   }); 

} DashboardCtrl.$inject = ['$scope', '$http', '$location', 'statusOf'];
