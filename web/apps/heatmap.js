'use strict';

angular.module('main')
   .directive('d3Heatmap', function () {
      var colorScale = d3.scale.quantize()
          .domain([0, 1])
          .range(d3.range(10).map(function(d) { return "cell" + d; }));

      return {
         restrict: 'E',
         scope: {
           val: '='
         },
         link: function postLink(scope, element, attrs) {
            var vis = d3.select(element[0]);

            scope.$watch('val', function (val, oldVal) {
               // clear the elements inside of the directive
               vis.selectAll('*').remove();

               // if 'val' is undefined, exit
               if (!val) {
                 return;
               }
               
               // ARC Group
               var heatmap = vis.append("div")
                   .attr("class", "heatmap");

               var boxes = heatmap.selectAll("div")
                   .data(val);

               boxes.enter().append("div")
                   .attr("class", function (d) { return "box "+colorScale(d); });

            });
         }
      };
   });