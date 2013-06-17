'use strict';

angular.module('main')
  .value('statusOf', function (type, value) {
      switch (type) {
         case 'load':
            if ( value > 1    ) return { status: 'warning', text: 'busy' };
            if ( value > 0.7  ) return { status: 'attention', text: 'warming' };
            return { status: 'normal' };
         default:
            if ( value > 95   ) return { status: 'warning', text: 'run out' };
            if ( value > 80   ) return { status: 'attention', text: 'running out' };
            return { status: 'normal' };
      }
   });