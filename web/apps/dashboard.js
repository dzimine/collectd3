'use strict';

function DashboardCtrl($s, $http) {

   var dataset = [],
       cellSize = 70;

//TODO: get json data
//    responsive design - flexible cell positions
//    add tooltip pop-up
//    firefox compatibility
//    learn svg filters - a lot of css attribute doesn't work on svg elements

   function render() {
      
      var width = $("#heatmap").width() - 100, // 50px is estimate padding TODO: make it flexible
         nColumns = Math.floor(width / cellSize); //number of columns

      var colorScale = d3.scale.quantize()

          .range(d3.range(10).map(function(d) { return "cell" + d; }));

      var svg = d3.select("#heatmap")
         .append("svg")
          .attr("width", "100%")
          .attr("height", "100%")
          .append("g")
          .attr("class", "heatmap");
//        .attr("filter", "url(#effectFilter)")
//        .attr("transform", "translate(" + ((width - cellSize * 10) / 2) + "," + (height - cellSize * 6 - 1) + ")");

      var rect = svg.selectAll("rect")
          .data(dataset)
          .enter().append("rect")
          .attr("class", function(d) { return colorScale(d[1]); }) 
          .attr("width", cellSize - 2) 
          .attr("height", cellSize - 2)
          .attr("x", function(d, i) { return (i % nColumns) * cellSize; })
          .attr("y", function(d, i) { return (Math.floor(i / nColumns)) * cellSize; })
          .attr("rx", 5)
          .attr("ry", 5);       

      $(window).resize(function() {
         debugger;
         width = $(window).width() - 100; 
          nColumns = Math.floor(width / cellSize); //number of columns
         svg.selectAll("rect")          
         .attr("x", function(d, i) { return ((i % nColumns) * cellSize + 2); })
          .attr("y", function(d, i) { return ((Math.floor(i / nColumns)) * cellSize + 2); });
      }); 

/*    $(".heatmap rect").mouseenter(function() {
         svg.append ("rect")
         .attr("class", "overlay")
         .attr("x", $(this).x)
         .attr("y", $(this).y)          
         .attr("rx", 5)
          .attr("ry", 5);  
      });*/
   }

   $s.fetch = function(){
      var t1 = new Date();
      $s.status = "Loading..."
      dataset = [
      [
         "localhost",
         0.0309824639999996, 
         "test me"
      ],
      [
         1367460500,
         0.7249121000000001
      ],
      [
         1367461000,
         0.2968007680000001
      ],
      [
         1367461500,
         0.845558568
      ],
      [
         1367462000,
         0.3994043439999999
      ],
      [
         1367462500,
         0.8266777599999999
      ],
      [
         1367463000,
         0.402107456
      ],
      [
         1367463500,
         0.948056608
      ],
      [
         1367464000,
         0.8193886399999998
      ],
      [
         1367464500,
         0.23527546
      ],
      [
         1367465000,
         0.831751884
      ],
      [
         1367465500,
         0.821958996
      ],
      [
         1367466000,
         0.3068594280000003
      ],
      [
         1367466500,
         0.7502890679999997
      ],
      [
         1367467000,
         0.7622226240000001
      ],
      [
         1367467500,
         0.6288730600000001
      ],
      [
         1367468000,
         0.838525416
      ],
      [
         1367468500,
         0.7189024
      ],
      [
         1367469000,
         0.7606797159999998
      ],
      [
         1367469500,
         0.95707032
      ],
      [
         1367470000,
         0.108320308
      ],
      [
         1367470500,
         0.798351508
      ],
      [
         1367471000,
         0.8516582159999999
      ],
      [
         1367471500,
         0.8698007759999997
      ],
      [
         1367466000,
         0.3068594280000003
      ],
      [
         1367466500,
         0.7502890679999997
      ],
      [
         1367467000,
         0.7622226240000001
      ],
      [
         1367467500,
         0.9288730600000001
      ],
      [
         1367468000,
         0.838525416
      ],
      [
         1367468500,
         0.7189024
      ],
      [
         1367469000,
         0.5606797159999998
      ],
      [
         1367469500,
         0.95707032
      ],
      [
         1367470000,
         0.708320308
      ],
      [
         1367470500,
         0.798351508
      ],
      [
         1367471000,
         0.5516582159999999
      ],
      [
         1367471500,
         0.8698007759999997
      ],
      [
         1367460000,
         0.9873593679999999
      ],
      [
         1367460500,
         0.7814628919999999
      ],
      [
         1367461000,
         0.644198919999998
      ],
      [
         1367461500,
         0.8008613239999999
      ],
      [
         1367462000,
         0.53441404
      ],
      [
         1367462500,
         0.8109043119999998
      ],
      [
         1367463000,
         0.8335292959999999
      ],
      [
         1367463500,
         0.8584394679999999
      ],
      [
         1367464000,
         0.865410148
      ],
      [
         1367464500,
         0.532007848
      ],
      [
         1367465000,
         0.8184902679999999
      ],
      [
         1367465500,
         0.79654298
      ],
      [
         1367466000,
         0.8711016039999997
      ],
      [
         1367466500,
         0.812263664
      ],
      [
         1367467000,
         0.3539433719999998
      ],
      [
         1367467500,
         0.8439550359999999
      ],
      [
         1367468000,
         0.849347668
      ],
      [
         1367468500,
         0.7600644559999998
      ],
      [
         1367469000,
         0.132527284
      ],
      [
         1367469500,
         0.8819375880000002
      ],
      [
         1367470000,
         0.7803886639999995
      ],
      [
         1367470500,
         0.7437519279999999
      ],
      [
         1367471000,
         0.8099902159999998
      ],
      [
         1367471500,
         0.154009756
      ]
   ];
      render();
      $s.status = "Done in " + (new Date() - t1) + " ms";
   }
   
   $s.fetch();



} DashboardCtrl.$inject = ['$scope', '$http'];




