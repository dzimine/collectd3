'use strict';

angular.module('main')
   .directive('d3Donut', ['statusOf', 'bytesToSize', function (statusOf, bytesToSize) {
      var w = 220, h = 220,
          r = Math.min(w, h) / 2,
          arc = d3.svg.arc().innerRadius(r - 12.5).outerRadius(r - 39.5),
          markers = [
              { domain: 0, range: 0 },
              { domain: 100, range: 360 }
          ];

      var degToRad = function(value) {
          return value * Math.PI / 180;
      }

      var scale = d3.scale.linear()
          .domain(markers.map(function (m) { return m.domain; }))
          .range(markers.map(function (m) { return degToRad(m.range); }));

      return {
         restrict: 'E',
         scope: {
           val: '=',
           title: '@'
         },
         link: function postLink(scope, element, attrs) {
            var svg = d3.select(element[0]).append("svg:svg")
               .attr("width", w).attr("height", h);

            scope.$watch('val', function (val, oldVal) {
               // clear the elements inside of the directive
               svg.selectAll('*').remove();

               // if 'val' is undefined, exit
               if (!val) {
                 return;
               }
               
               var total = val.used.value + val.free.value,
                   used = val.used.value,
                   percent = used/total*100;

               // ARC Group
               var arcGroup = svg.append("svg:g")
                  .attr("class", "arcGroup")
                  .attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")");

               arcGroup.append("svg:path")
                  .attr("class", "load-0 svg-" + statusOf('memory', percent).status)
                  .attr("d", arc.startAngle(scale(markers[0].domain)).endAngle(scale(percent)));

               arcGroup.append("svg:path")
                  .attr("class", "load-1")
                  .attr("d", arc.startAngle(scale(percent)).endAngle(scale(markers[markers.length-1].domain)));

               // CTR GROUP
               var ctrGroup = svg.append("svg:g")
                  .attr("class", "ctrGroup")
                  .attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")");

               var value = ctrGroup.append("svg:text")
                  .attr("dy", ".15em")
                  .attr("dx", "-.2em")
                  .attr("text-anchor", "middle")
                  .attr("class", "chart-kpi svg-" + statusOf('memory', percent).status)
                  .text(bytesToSize(used).value);
                  
               var value_bbox = value.node().getBBox();

               var multi = ctrGroup.append("svg:text")
                  .attr("dy", ".4em")
                  .attr("dx", value_bbox.x + value_bbox.width)
                  .attr("text-anchor", "left")
                  .attr("class", "chart-label")
                  .text(bytesToSize(used).multi);

               var label = ctrGroup.append("svg:text")
                  .attr("dy", "2em")
                  .attr("text-anchor", "middle")
                  .attr("class", "chart-label")
                  .text(scope.title);

            });
         }
      };
   }]);