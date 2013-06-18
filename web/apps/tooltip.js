'use strict';

angular.module('main')
   .directive('d3Tooltip', function () {
      return {
         restrict: 'E',
         template: '<div class="mytooltip" style="position: fixed; z-index: 10; visibility: {{message.text && \'visible\' || \'hidden\'}}; left: {{message.x + 10|| 0}}px; top: {{message.y + 10|| 0}}px">{{message.text}}</div>',
         scope: {
           message: '='
         },
         replace: true
      };
   });