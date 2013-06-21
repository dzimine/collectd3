/*jshint globalstrict:true, jquery:true, browser:true */
'use strict';

function DashboardCtrl($s, $http, $location, statusOf, bytesToSize, countByTemp) {

   $s.countByTemp = countByTemp;

   $s.switchCard = function (name) {
      $location.hash(name).replace();
   };

   $s.card = $location.hash() || "load";

   $s.$on('$routeChangeSuccess', function () {
      $s.fetchView($s.card);
   });
   
   $s.statusOf = statusOf;
   
   $s.tooltip = {};
   
   $s.moveTo = function (host) {
      $location.path('/details/' + host);
      $s.$apply();
   };
   
   $s.showTooltip = function (host, value, label) {
      $s.tooltip.text = host;
      $s.tooltip.details = {};
      $s.tooltip.details[label] = value.toFixed(2);
      $s.$apply();
   };
   
   $s.showMemoryTooltip = function (host, details, label) {
      $s.tooltip.text = host;
      $s.tooltip.details = {};
      $s.tooltip.details[label] = bytesToSize(details.used).value + ' ' + bytesToSize(details.used).multi + ' of ' + 
         bytesToSize(details.used + details.free).value + ' ' + bytesToSize(details.used + details.free).multi;
      $s.$apply();
   };

   $s.hideTooltip = function () {
      $s.tooltip = {};
      $s.$apply();
   };
   
   $s.moveTooltip = function (x,y) {
      $s.tooltip.x = x;
      $s.tooltip.y = y;
      $s.$apply();
   };

   $s.fetchView = function(view) {
      var t1 = new Date();
      $s.context.status = "Loading...";
      $http.get("/data/" + view)
         .success(function(res) {
            $s[view] = res;
            $s.context.status = "Done in " + (new Date() - t1) + " ms";
         }).error(function() {
            $s[view] = {};
            $s.context.status = "Error getting data. Check the log.";
         });
   };

   $s.fetch = function(){
      var t1 = new Date();
      $s.context.status = "Loading...";
      
      $http.get("/data/aggregate")
         .success(function(res) {
            $s.aggregate = res;
            $s.status = "Done in " + (new Date() - t1) + " ms";
         }).error(function() {
            $s.aggregate = {};
            $s.context.status = "Error getting data. Check the log.";
         });

   };

   $s.fetch();

} DashboardCtrl.$inject = ['$scope', '$http', '$location', 'statusOf', 'bytesToSize', 'countByTemp'];
