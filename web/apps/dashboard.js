/*jshint globalstrict:true, jquery:true, browser:true */
'use strict';

function DashboardCtrl($s, $http, $location, statusOf, bytesToSize, countByTemp, $log) {

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
      var total = details.used + details.free + details.cached + details.buffered;
      
      $s.tooltip.text = host;
      $s.tooltip.details = {};
      $s.tooltip.details[label] = bytesToSize(details.used).value + ' ' + 
                                  bytesToSize(details.used).multi + ' of ' + 
                                  bytesToSize(total).value + ' ' + bytesToSize(total).multi;
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
      $log.time("Loading " + view.toUpperCase() + " data.")
      $http.get("/data/" + view)
         .success(function(res) {
            $s[view] = res;
            $log.time("Data for " + view.toUpperCase() + " has been loaded.");
         }).error(function() {
            $s[view] = {};
            $log.time("Data for " + view.toUpperCase() + " has been failed.");
         });
   };

   $s.fetch = function(){
      $log.time("Loading Aggregate data.")      
      $http.get("/data/aggregate")
         .success(function(res) {
            $s.aggregate = res;
            $log.time("Aggregate data has been loaded.");
         }).error(function() {
            $s.aggregate = {};
            $log.time("Aggregate data has been failed.");
         });

   };

   $log.resetTime();
   $s.fetch();

} DashboardCtrl.$inject = ['$scope', '$http', '$location', 'statusOf', 'bytesToSize', 'countByTemp', '$log'];
