'use strict';

/* App Module */
angular.module('main', []).
      config(['$routeProvider', function($routeProvider) {
   $routeProvider
         .when('/d3',
            {templateUrl: 'apps/d3raw.html', controller: 'D3rawCtrl'})
         .when('/dangle',
            {templateUrl: 'apps/d3dangle.html', controller: 'D3DangleCtrl'})
         .otherwise({redirectTo: '/d3'});
}]);

var NavCtrl = ['$scope', '$location', function ($s, $loc) {
// Notice an alternative way to trigger injection. But it generates jslint warning.

 $s.isActiveLocation = function (route) {
    return route === $loc.path();
 };

}];