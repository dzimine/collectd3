'use strict';

function DashboardCtrl($s, $http) {

   d3.select("svg").selectAll("circle")
      .data([5,10,15,20,25,30])
      .enter()
      .append("circle")
      .attr("cx", function(d,i) { return (i*20)+25;})
      .attr("cy", 50)
      .attr("r", 10);


   // var matrix = [
   //   [11975,  5871, 8916, 2868],
   //   [ 1951, 10048, 2060, 6171],
   //   [ 8010, 16145, 8090, 8045],
   //   [ 1013,   990,  940, 6907]
   // ];
   // var tr = d3.select("footer").append("table").selectAll("tr")
   //     .data(matrix)
   //   .enter().append("tr");

   // var td = tr.selectAll("td")
   //     .data(function(d) { return d; })
   //   .enter().append("td")
   //     .text(function(d) { return d; });

   d3.select("p").insert("p","p").text('say what');

} DashboardCtrl.$inject = ['$scope', '$http'];




