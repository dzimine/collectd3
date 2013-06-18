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

               keys.forEach(function (key, i) {
                  var data = val[key];

                  var y = d3.scale.linear()
                        .domain([0, d3.max(data, function (e) { return e[1]; })])
                        .range([0 + margin, h - margin]),
                      x = d3.scale.linear()
                        .domain([data[0][0], data[data.length-1][0]])
                        .range([0 + margin, w - margin]);

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
               
               // First approach to interactivity
               // -------------------------------
               // Idea was to draw a bunch of lines, hide them by css and show only one
               // that hovered. Approach had failed due small mouseover area of svg:line.
               // Wee need something like padding for svg:line to make it happens.
               //
               // var data = val[scope.scheme.split(" ")[0]];
               //          
               // var x = d3.scale.linear().domain([data[0][0], data[data.length-1][0]]).range([0 + margin, w - margin]);
               //          
               // var meridianGrp = vis.append("svg:g");
               //             
               // meridianGrp.selectAll("line")
               //    .data(data)
               //    .enter().append('svg:line')
               //    .attr("class", "meridian")
               //    .attr("x1", function (d) { return x(d[0]); })
               //    .attr("x2", function (d) { return x(d[0]); })
               //    .attr("y1", margin)
               //    .attr("y2", scope.scheme.split(" ").length * h - margin)
               //    .on("mouseover", function() { console.log(1);d3.select(this).classed("active", true ) })
               //    .on("mouseout", function() { d3.select(this).classed("active", false ) })

               // Second approach to interactivity
               // --------------------------------
               // Idea was to intercept mousemove coordinates and find nearest data 
               // point to show. We need something like spartial array to make it happens
               // and i don't see one in d3. Also, it's quite cpu intence approach due 
               // to mousemove event flood.
               //
               // var x = d3.scale.linear().domain([val[keys[0]][0][0], val[keys[0]][val[keys[0]].length-1][0]]).range([0 + margin, w - margin]);
               // 
               // vis.append("svg:rect")
               //    .attr("x", margin )
               //    .attr("y", margin )
               //    .attr("width", w - margin*2 )
               //    .attr("height", h * keys.length - margin*2 )
               //    .attr("fill", "transparent")
               //    .on("mousemove", function () {
               //       console.log(x.invert(d3.mouse(this)[0]));
               //    })
            });
         }
      };
   });