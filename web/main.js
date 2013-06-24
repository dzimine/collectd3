'use strict';

/* App Module */
angular.module('main', [])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/dashboard',
        {templateUrl: 'apps/dashboard.html', controller: 'DashboardCtrl'})
      .when('/details/:host',
        {templateUrl: 'apps/details.html', controller: 'DetailsCtrl'})
      .otherwise({redirectTo: '/dashboard'});
  }]);

angular.module('main')
  .controller('MainCtrl', ['$scope', '$location', function ($s, $loc) {
    // Notice an alternative way to trigger injection. But it generates jslint warning.

    // Spec: Show the hostname in nav bar.
    // Keep the selected host in navbar (greyed out) when route is back to dashboard.
    $s.context = {
      status : "",
      host: ""
    };

    $s.$on("$routeChangeStart", function (event, next) {
      if (next.params.host) {
        $s.context.host = next.params.host;
      }
    });

    $s.isActiveLocation = function (route) {
      return route === $loc.path();
    };

  }]);