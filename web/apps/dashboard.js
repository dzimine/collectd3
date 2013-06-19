/*jshint globalstrict:true, jquery:true, browser:true */
/*global d3*/
'use strict';

function DashboardCtrl($s, $http, $location, statusOf) {

   var tab = '',
       minWidth = 800; // minimal width to maintain default cell size
   
   $s.switchCard = function (name) {
      tab = name;
      $s.fetchView(name);
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
   
   $s.showTooltip = function (host, value, label) {
      $s.tooltip.text = host + " | " + label + ' ' + value.toFixed(2);
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

   $s.fetchView = function(view) {
      var t1 = new Date();
      $s.context.status = "Loading...";
      $http.get("/data/" + view)
         .success(function(res) {
            $s[view] = res;
            $s.context.status = "Done in " + (new Date() - t1) + " ms";
         }).error(function(err) {
            $s[view] = {};
            $s.context.status = "Error getting data. Check the log.";
         });
   }

   $s.fetch = function(){
      var t1 = new Date();
      $s.context.status = "Loading...";
      
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
   $s.fetchView("load");
   
   $(window).resize(function() {
      //TODO: figure why it doesn't work...
      //render();
   }); 

} DashboardCtrl.$inject = ['$scope', '$http', '$location', 'statusOf'];
