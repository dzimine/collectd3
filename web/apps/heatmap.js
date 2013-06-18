'use strict';

angular.module('main')
   .directive('d3Heatmap', function () {
      var colorScale = d3.scale.quantize()
          .domain([0, 1])
          .range(d3.range(10).map(function(d) { return "cell" + d; }));

      return {
         restrict: 'E',
         scope: {
           val: '=',
           d3Click: '&',
           d3Mouseover: '&',
           d3Mouseout: '&',
           d3Mousemove: '&'
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

               //TODO: change output of vcpu to [{ key: 'cpu-1', value: 1.11}]
               if (angular.isNumber(val[0])) {
                  val = val.map(function (e, i) {
                     return { key: i, value: e}
                  })
               }

               //TODO: change output of heatmap to [{ key: 'localhost', value: 1.11}]
               if (angular.isArray(val[0])) {
                  val = val.map(function (e, i) {
                     return { key: e[0], value: e[1]}
                  })
               }

               // ARC Group
               var heatmap = vis.append("div")
                   .attr("class", "heatmap");

               var boxes = heatmap.selectAll("div")
                   .data(val);

               boxes.enter().append("div")
                   .attr("class", function (d) { return "box "+colorScale(d.value); })
                   .on("click", function (d) { scope.d3Click(d); })
                   .on("mouseover", function (d) { scope.d3Mouseover(d); })
                   .on("mouseout", function (d) { scope.d3Mouseout(d); })
                   .on("mousemove", function (d) { scope.d3Mousemove({x: event.x, y: event.y}); });

            });
         }
      };
   });