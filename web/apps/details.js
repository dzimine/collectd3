'use strict';

function DetailsCtrl($s, $http) {

   $s.x=0;
   $s.dataLoad = [];
   $s.dataMemory = [];
   $s.useMock = false;
   var chartLoad;
   var chartMemory;

   function render(){
      nv.addGraph(function() {
         //chartLoad = nv.models.multiBarChart();
         chartLoad = nv.models.lineChart();
         chartLoad
             .x(function(d,i) {  return d[0]; })
             .y(function(d) { return d[1]; })
             //TODO: find better way to define domain: 1) start from 0 and 2) end at max.
             .forceY([0,1.5]);
         
         chartLoad.xAxis 
            .axisLabel('Time')
            .showMaxMin(false)
            .tickFormat(function(d) { 
               return d3.time.format('%H:%M')(new Date(d*1000)) 
            });

         chartLoad.yAxis
             .axisLabel('CPU')
             .tickFormat(d3.format(',.2f'));

         d3.select('#load svg')
             .datum($s.dataLoad)
             .transition().duration(200)
             .call(chartLoad);

         //TODO: Figure out a good way to do this automatically
         //DZ: the next line works with d3v2 but generates error in d3v3
         nv.utils.windowResize(chartLoad.update);
         //DZ: the next line works with both d3v3 and d3v2
         //nv.utils.windowResize(function() { d3.select('#load svg').call(chartLoad) });

         chartLoad.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

         return chartLoad;
      });

      nv.addGraph(function() {
         
         chartMemory = nv.models.multiBarChart();
         chartMemory
             .x(function(d,i) {  return d[0]; })
             .y(function(d) { return d[1]/1073741824; })
             .forceY([0,2.0]);
             //TODO: Figure how to show up to TOTAL memory
         
         chartMemory.xAxis 
            .axisLabel('Time')
            .showMaxMin(false)
            .tickFormat(function(d) { 
               return d3.time.format('%H:%M')(new Date(d*1000)) 
            });

         chartMemory.yAxis
             .axisLabel('Memory')
             .tickFormat(d3.format(',.2e'));

         d3.select('#memory svg')
             .datum($s.dataMemory)
             .transition().duration(200)
             .call(chartMemory);

         nv.utils.windowResize(chartMemory.update);
         chartMemory.dispatch.on('stateChange', function(e) { nv.log('New State:', JSON.stringify(e)); });

         return chartMemory;
      });        
   }

   $s.fetch = function  (){
      var t1 = new Date();
      // TODO: get the parameters from hour/3 hours/day/week/year selector
      var params = {"from":1367470900, "to":1367477900, "r":100};
      $s.status = "Loading..."
      var urlLoad = $s.useMock ? "/load.json" : "/data/localhost/load"; 
      $http.get(urlLoad, {params : params})
         .success(function(res) {
            $s.dataLoad = res;
            $s.status = "Done in " + (new Date() - t1) + " ms";
            render();
         }).error(function(err) {
            $s.dataLoad =[];
            $s.status = "Error getting data. Check the log.";
            render();
         });

      //TODO better nicer way to show second chart...
      var urlMemory = $s.useMock ? "/memory.json" : "/data/localhost/memory"; 
      $http.get(urlMemory, {params : params})
        .success(function(res) {
           $s.dataMemory = res;
           //TODO: yeah, right, it overwrites the old status. Fine. 
           $s.status = "Done in " + (new Date() - t1) + " ms";
           render();
        }).error(function(err) {
           $s.dataMemory =[];
           render();
        });
   }

   $s.fetch();
 

} DetailsCtrl.$inject = ['$scope', '$http'];




