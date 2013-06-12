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

 $s.isActiveLocation = function (route) {
    return route === $loc.path();
 };

}];