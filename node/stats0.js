var rrd = require("./node_rrd/lib/rrd");

var getAll = exports.getAll = function(req, res, next) {
   var filename = __dirname + "/sampledata/localhost/load/load.rrd";
   //var filename = "../rrd/test.rrd";
   rrd.info(filename, function(info) {
     console.log("RRD ", info.filename, "last updated on ", info.last_update);
   }); 

   var resolution = 500;
   var period = 12000; /* seconds */
   var last_update = 1367470912;
   // round up times to resolutions
   var t1 = Math.round(last_update / resolution) * resolution;
   var t0 = Math.round((last_update - period)/ resolution) * resolution;
   console.log ("period: ", t0, t1);

   // rrdtool fetch load.rrd AVERAGE --start 1367470912 --end 1367477912
   // start and end must be multipe of desired resolution, to use the right RRA
   var sho =[], mid = [], lon = [];
   rrd.fetch(filename,  
     //{ cf: "AVERAGE", start: t1-5000, end: t1, resolution:10 }, 
     { cf: "AVERAGE", start: t0, end: t1, resolution:resolution }, 
     function(time, data) {
         // Last record - when fetch callback called with (null,null)
         if (time == null && data == null) {

            var result = [
               {
                  key:"shortterm",
                  "values": sho
               },
               {
                  key:"midterm",
                  "values": mid
               },
               {
                  key:"longterm",
                  "values": lon
               }
            ]
            console.log(JSON.stringify(result));
            return;
         }
         
         if ("shortterm" in data) {
             sho.push([time, data["shortterm"]]);
         }
         if ("midterm" in data) {
            mid.push([time, data["midterm"]]);
         } 
         if ("longterm" in data) {
            lon.push([time, data["longterm"]]);
         }
   });
   //FIXME: problem - don't get a call back when fetch command completes.
   //TODO: use "async"
}

getAll(null,null,null);





