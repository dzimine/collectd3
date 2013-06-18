'use strict';

angular.module('main')
   .directive('d3Timeseries', function () {
      var w = 1024,
          h = 100,
          margin = 20;
          
      return {
         restrict: 'E',
         scope: {
           val: '=',
           scheme: '@'
         },
         link: function postLink(scope, element, attrs) {
            var vis = d3.select(element[0]).append("svg:svg")
                .attr("width", w);

            scope.$watch('val', function (val, oldVal) {
               // clear the elements inside of the directive
               vis.selectAll('*').remove();

               // if 'val' is undefined, exit
               if (!val) {
                 return;
               }
               
               var keys = scope.scheme.split(" ");

               var x = d3.scale.linear()
                  .domain([val[keys[0]][0][0], val[keys[0]][val[keys[0]].length-1][0]])
                  .range([0 + margin, w - margin]);

               keys.forEach(function (key, i) {
                  var data = val[key];

                  var y = d3.scale.linear()
                        .domain([0, d3.max(data, function (e) { return e[1]; })])
                        .range([0 + margin, h - margin]);

                  vis.attr("height", h*(i+1));

                  var lineGrp = vis.append("svg:g")
                      .attr("transform", "translate(0, " + h*(i+1) + ")");

                  var line = d3.svg.line().interpolate("basis")
                      .x(function(d,i) { return x(d[0]); })
                      .y(function(d) { return -1 * y(d[1]); })

                  lineGrp.append("svg:path")
                     .attr("class", "graph " + key)
                     .attr("d", line(data));
               });

               var meridianGrp = vis.append("svg:g");

               var medians = meridianGrp.selectAll("g")
                  .data(val[keys[0]])
                  .enter()
                  .append('svg:g')
                  .on("mouseover", function() { 
                     d3.select(this).classed("active", true );
                  })
                  .on("mouseout", function() { 
                     d3.select(this).classed("active", false ); 
                  });

               medians.append('svg:line')
                  .attr("class", "meridian-bg")
                  .attr("x1", function (d) { return x(d[0]); })
                  .attr("x2", function (d) { return x(d[0]); })
                  .attr("y1", margin)
                  .attr("y2", scope.scheme.split(" ").length * h - margin);

               medians.append('svg:line')
                  .attr("class", "meridian")
                  .attr("x1", function (d) { return x(d[0]); })
                  .attr("x2", function (d) { return x(d[0]); })
                  .attr("y1", margin)
                  .attr("y2", scope.scheme.split(" ").length * h - margin);

            });
         }
      };
   });