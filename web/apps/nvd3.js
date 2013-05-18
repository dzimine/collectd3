'use strict';

function Nvd3Ctrl($s, $http) {

   $s.x=0;
   $s.data = [];
   var chart;

   function render(){
      nv.addGraph(function() {
         //chart = nv.models.multiBarChart();
         chart = nv.models.lineChart();
         chart
             .x(function(d,i) {  return d[0]; })
             .y(function(d) { return d[1]; })
             //TODO: find better way to define domain: 1) start from 0 and 2) end at max.
             .forceY([0,1.5]);
         
         chart.xAxis 
            .axisLabel('Time')
            .showMaxMin(false)
            .tickFormat(function(d) { 
               return d3.time.format('%H:%M')(new Date(d*1000)) 
            });

         chart.yAxis
             .axisLabel('Voltage (v)')
             .tickFormat(d3.format(',.2f'));

         d3.select('#load svg')
             .datum($s.data)
             .transition().duration(200)
             .call(chart);

         //TODO: Figure out a good way to do this automatically
         //DZ: the next line works with d3v2 but generates error in d3v3
         nv.utils.windowResize(chart.update);
         //DZ: the next line works with both d3v3 but not sure about d3v2
         //nv.utils.windowResize(function() { d3.select('#chart1 svg').call(chart) });

         chart.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

         return chart;
      });        
   }

   $s.fetch = function  (){
      var t1 = new Date();
      var params = {"from":"t0", "to":"t1", "r":"resolution"};
      $s.status = "Loading..."
      var url = $s.useMock ? "/load.json" : "/data/stats"; 
      $http.get(url, {params : params})
         .success(function(res) {
            $s.data = res;
            $s.status = "Done in " + (new Date() - t1) + " ms";
            render();
         }).error(function(err) {
            $s.data =[];
            $s.status = "Error getting data. Check the log.";
            render();
         });
   }

   $s.fetch();
 

} Nvd3Ctrl.$inject = ['$scope', '$http'];




