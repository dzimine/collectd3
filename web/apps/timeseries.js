'use strict';

angular.module('main')
   .directive('d3Timeseries', function () {
      var w = 1024,
          h = 100,
          margin = 20;

      var periods = {
         day: {
            count: d3.time.hours,
            step: 4,
            format: '%H:%M'
         },
         week: {
            count: d3.time.days,
            step: 1,
            format: '%a %d'
         },
         month: {
            count: d3.time.days,
            step: 4,
            format: '%B %d'
         }
      };
      
      return {
         restrict: 'E',
         scope: {
           val: '=',
           scheme: '@',
           period: '=',
           d3Mouseover: '&',
           d3Mouseout: '&',
           d3Mousemove: '&'
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

               vis.attr("height", h*(keys.length) + 30);

               var x = d3.scale.linear()
                  .domain([val[keys[0]][0][0], val[keys[0]][val[keys[0]].length-1][0]])
                  .range([0 + margin, w - margin]);

               keys.forEach(function (key, i) {
                  var data = val[key];
                  
                  if (data[data.length - 1][1] === null) {
                     data.pop();
                  }
                  
                  var y = d3.scale.linear()
                        .domain([0, d3.max(data, function (e) { return e[1]; })])
                        .range([0, h - margin]);

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
                  .on("mouseover", function(d, i) {
                     d3.select(this).classed("active", true );
                     scope.d3Mouseover({ time: d[0], load: val.load[i][1], memory: val.memory[i][1] });
                  })
                  .on("mouseout", function(d, i) {
                     d3.select(this).classed("active", false );
                     scope.d3Mouseout({ time: d[0], load: val.load[i][1], memory: val.memory[i][1] });
                  })
                  .on("mousemove", function () { 
                     scope.d3Mousemove({x: event.x, y: event.y}); 
                  });

               medians.append('svg:line')
                  .attr("class", "meridian-bg")
                  .attr("x1", function (d) { return x(d[0]); })
                  .attr("x2", function (d) { return x(d[0]); })
                  .attr("y1", margin)
                  .attr("y2", scope.scheme.split(" ").length * h);

               medians.append('svg:line')
                  .attr("class", "meridian")
                  .attr("x1", function (d) { return x(d[0]); })
                  .attr("x2", function (d) { return x(d[0]); })
                  .attr("y1", margin)
                  .attr("y2", scope.scheme.split(" ").length * h);

               var time = d3.time.scale()
                  .domain([new Date(val[keys[0]][0][0]*1000), new Date(val[keys[0]][val[keys[0]].length - 1][0]*1000)])
                  .range([0 + margin, w - margin]);

               var period = periods[scope.period];

               var xAxis = d3.svg.axis()
                  .scale(time)
                  .orient('bottom')
                  .ticks(period.count, period.step)
                  .tickFormat(d3.time.format(period.format))
                  .tickSize(0)
                  .tickPadding(8);

               vis.append('g')
                  .attr('class', 'x-axis')
                  .attr('transform', 'translate(0, ' + h*(keys.length) + ')')
                  .call(xAxis);

            });
         }
      };
   });