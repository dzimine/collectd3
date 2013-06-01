'use strict';

function DashboardCtrl($s, $http) {

   var dataset = [],
       minWidth = 800; // minimal width to maintain default cell size
   
   function render() {

      var cellSize = 70; // default size when space is adequate
          
      if ($("#heatmap").width() < minWidth) { cellSize = Math.ceil($("#heatmap").width() / 12); } 
      
      var width = $("#heatmap").width() - cellSize, //leave padding space for one cell
          nColumns = Math.floor(width / cellSize); //number of columns
      
      var colorScale = d3.scale.quantize()
         .domain([0, 1])
         .range(d3.range(10).map(function(d) { return "cell" + d; }));

      var tooltip = d3.select("#heatmap")
         .append("div")
         .attr("class", "mytooltip")
         .style("position", "absolute")
         .style("z-index", "10")
         .style("visibility", "hidden");

      d3.select("svg").remove(); // clear content area

      var svg = d3.select("#heatmap")
         .append("svg")
          .attr("width", "100%")
          .attr("height", "100%")
          .append("g")
          .attr("class", "heatmap");
//        .attr("filter", "url(#effectFilter)")

      var rect = svg.selectAll("rect")
          .data(dataset)
          .enter().append("rect")
          .attr("class", function(d) { return colorScale(d[1]); }) 
          .attr("width", cellSize - 2) 
          .attr("height", cellSize - 2)
          .attr("x", function(d, i) { return (i % nColumns) * cellSize; })
          .attr("y", function(d, i) { return (Math.floor(i / nColumns)) * cellSize; })
          .attr("rx", 5)
          .attr("ry", 5)
          .on("mouseover", function(d) { return tooltip.text("Host ID: " + d[0] + " | CPU Usage: " + Math.round(100 * d[1]) + "%").style("visibility", "visible"); })
//          .on("mouseover", function(d) { return tooltip.style("visibility", "visible").append("p").text("Host ID: " + d[0]).append("p").text("CPU Usage: " + Math.round(100 * d[1]) + " %"); })
          .on("mousemove", function() { return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
          .on("mouseout", function() { return tooltip.style("visibility", "hidden"); });      
   }

   $s.fetch = function(){
      var t1 = new Date();
      $s.status = "Loading...";
      var urlLoad = "/heatmap.json";
      $http.get(urlLoad)
         .success(function(res) {
            dataset = res;
            $s.status = "Done in " + (new Date() - t1) + " ms";
            render();
         }).error(function(err) {
            dataset =[];
            $s.status = "Error getting data. Check the log.";
            render();
         });
   }
   
   $s.fetch();
   
   $(window).resize(function() {
      render();
   }); 

} DashboardCtrl.$inject = ['$scope', '$http'];




