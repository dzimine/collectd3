'use strict';

/* App Module */
angular.module('main', []).
      config(['$routeProvider', function($routeProvider) {
   $routeProvider
         .when('/dashboard',
            {templateUrl: 'apps/dashboard.html', controller: 'DashboardCtrl'})
         .when('/details/:host',
            {templateUrl: 'apps/details.html', controller: 'DetailsCtrl'})
         .otherwise({redirectTo: '/dashboard'});
}]);

var NavCtrl = ['$scope', '$location', function ($s, $loc) {
// Notice an alternative way to trigger injection. But it generates jslint warning.
   
   // Spec: Show the hostname in nav bar. 
   // Keep the selected host in navbar (greyed out) when route is back to dashboard.
   $s.hostname = "";
   $s.$on("$routeChangeStart", function(event, next, current) {
      console.log(next, current);
      if (next.params.host) {
         $s.hostname = next.params.host;
      }
   });

   $s.isActiveLocation = function (route) {
      return route === $loc.path();
   };

}];