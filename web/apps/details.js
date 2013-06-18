'use strict';

function DetailsCtrl($s, $http, $routeParams, bytesToSize) {

   $s.$routeParams = $routeParams;
   $s.bytesToSize = bytesToSize;

   $s.countByTemp = function (temp, vcpus) {
      var levels = {
         hot: function (e) {
            return e > 0.8;
         },
         warm: function (e) {
            return e > 0.5 && e <= 0.8;
         },
         cold: function (e) {
            return e <= 0.5;
         }
      }
      return (vcpus || []).filter(levels[temp]).length;
   }

   $s.x=0;
   $s.useMock = false;
   //TODO: remove temp hack to fit ndv3 data structure for line chart. 
   $s.dataLoad = [{key:"Load", values:[]}];
   $s.dataMemory = [ {key:"Memory", values:[]} ];

   var chartLoad;
   var chartMemory;

   function render(){
      nv.addGraph(function() {
         //chartLoad = nv.models.multiBarChart();
         chartLoad = nv.models.lineChart();
         chartLoad
             .x(function(d,i) {  return d[0]*1000; })
             .y(function(d) { return d[1]; })
             //TODO: find better way to define domain: 1) start from 0 and 2) end at max.
             .forceY([0,1.5]);
         
         //FIXME: xAxis labels are totally off. Never mind we'll dump ndv3
         chartLoad.xAxis 
            .axisLabel('Time')
            .showMaxMin(false)
            .tickFormat(function(d) { 
               return d3.time.format('%H:%M')(new Date(d)) 
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

         chartLoad.dispatch.on('stateChange', function(e) { 
            nv.log('New State:', JSON.stringify(e)); 
         });

         return chartLoad;
      });

      nv.addGraph(function() {
         
         chartMemory = nv.models.multiBarChart();
         chartMemory
             .x(function(d,i) {  return d[0]*1000; })
             .y(function(d) { return d[1]/1073741824; })
             .forceY([0,1.0]);
             //TODO: Figure how to show up to TOTAL memory
         
         //FIXME: xAxis labels are totally off. Never mind we'll dump ndv3
         chartMemory.xAxis 
            .axisLabel('Time')
            .showMaxMin(false)
            .tickFormat(function(d) { 
               return d3.time.format('%H:%M')(new Date(d)) 
            });

         chartMemory.yAxis
             .axisLabel('Memory')
             .tickFormat(d3.format(',.2'));

         d3.select('#memory svg')
             .datum($s.dataMemory)
             .transition().duration(100)
             .call(chartMemory);

         nv.utils.windowResize(chartMemory.update);
         chartMemory.dispatch.on('stateChange', function(e) { 
            nv.log('New State:', JSON.stringify(e)); 
         });

         return chartMemory;
      });     
   }

   $s.fetch = function  (){
      var t1 = new Date();
      // TODO: get the parameters from hour/3 hours/day/week/year selector
      var params = { period:"day" };
      $s.context.status = "Loading..."

      var urlInfo = $s.useMock ? "/host-info.json" 
                : "/data/" + $routeParams.host + "/info";
      $http.get(urlInfo)
         .success(function (res) {
            $s.info = res;
            $s.context.status = "Done in " + (new Date() - t1) + " ms";
         })
         .error(function (err) {
            $s.info = {}
            $s.context.status = "Error getting data. Check the log.";
         });

      var urlGraph = $s.useMock ? "/graph.json" 
               : "/data/" + $routeParams.host + "/graph";
      $http.get(urlGraph, {params : params})
         .success(function(res) {
            $s.dataLoad[0].values = res.load;
            $s.dataMemory[0].values = res.memory;
            $s.context.status = "Done in " + (new Date() - t1) + " ms";
            render();
         }).error(function(err) {
            $s.dataLoad[0].values = [];
            $s.dataMemory[0].values = [];
            $s.context.status = "Error getting data. Check the log.";
            render();
         });
        
   }

   $s.fetch();
 

} DetailsCtrl.$inject = ['$scope', '$http', '$routeParams', 'bytesToSize'];




