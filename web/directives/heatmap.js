'use strict';

angular.module('main')
  .directive('d3Heatmap', function () {
    return {
      restrict: 'E',
      scope: {
        val: '=',
        domain: '@',
        d3Click: '&',
        d3Mouseover: '&',
        d3Mouseout: '&',
        d3Mousemove: '&'
      },
      link: function postLink(scope, element) {
        var vis = d3.select(element[0]);

        scope.$watch('val', function (val) {
          var colorScale = d3.scale.quantize()
              .domain(scope.domain.split(',').map(function (e) {
                return parseFloat(e, 10);
              }))
              .range(d3.range(10).map(function (d) { return "cell" + d; }));

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
            .attr("class", function (d) {
              if (d === null) {
                return "box";
              } else {
                return "box " + colorScale(d.value);
              }
            })
            .on("click", function (d) { scope.d3Click(d); })
            .on("mouseover", function (d) { scope.d3Mouseover(d); })
            .on("mouseout", function (d) { scope.d3Mouseout(d); })
            .on("mousemove", function () { scope.d3Mousemove({x: event.x, y: event.y}); });
        });
      }
    };
  });