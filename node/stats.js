var fs = require('fs');
var execFile = require('child_process').execFile;
var async = require('async');
var rrd = require("rrd");
var rrdtool= "rrdtool"; 

/******************************************************************************/
//  CONFIGURATION 
//   The root of rrd data, collected by collectd
var collectDataRoot = __dirname + "/sampledata";


/******************************************************************************/

var getCpuLoad = exports.getCpuLoad = function(req, res, next) {
   fetchRRD("load/load.rrd", "MAX", req, 
      function(err, data) {
         if (err) { 
            next(err);
         } else {
            res.json(formatOutput(data)); 
         }
      });
}

var getMemory = exports.getMemory = function(req, res, next) {
   async.parallel([
         function (callback) {
               fetchRRD("memory/memory-active.rrd", "AVERAGE", req, callback);
         }, 
         function (callback) {
               fetchRRD("memory/memory-free.rrd", "AVERAGE", req, callback);
         }
      ],
      function(err, data){ 
         if (err) { 
            next(err);
         } else {
            var keyLabels = ["active", "free"];
            var results = [];
            for (var i = 0; i < data.length; i++) {
               var record = formatOutput(data[i]);
               results = results.concat(formatOutput(data[i]));
               results[i]["key"]=keyLabels[i];
            }
            res.json(results); 
         }
      }
   );
}

var getCpuHeatmap = exports.getCpuHeatmap = function(req, res, next) {
   getInfoForAllHosts("load/load.rrd", 
      ["ds[shortterm].value", "last_update"], 
      function(err, data) {
         if (err) {
            next(err);
         } else {
            res.json(data);
         }
      });
}

/**
* fetchRRD: Calls rrdtool and returns the data. 
* rrd_file - relative path to rrd file collectDataRoot/{host_id} 
* cf - RRD Config Fucnction (AVERAGE, MIN, MAX, LAST) 
* req - passthrough request parameters, must have host id, may have start/end/resolution.
* 
* Note: it uses execFile, thus will throw if rdtool output result > 200Mb
* If the buffer is bigger, one can switch to spawn, 
* but think again: why returning big data to the client?
*/
var fetchRRD = function (rrd_file, cf, req, callback) {

   var host = req.params.id;
   var rrd_file_path = collectDataRoot + "/" + host + "/" + rrd_file;
   var params = [];
   if (req.query.from) { params.push("--start", req.query.from); }
   if (req.query.to) { params.push("--end", req.query.to); }
   if (req.query.r) { params.push("-r", req.query.r); }
  
   var args = ["fetch", rrd_file_path, cf].concat(params);
   console.log("Running: ", rrdtool, args.join(" "));      

   var child = execFile(rrdtool, args, function(err, stdout, stderr) {
          if (err) {
            callback(err);
         } else { 
            callback(null, stdout);
         }
      });
}

var infoRRD = function (rrd_file, host, callback) {
   
   var rrd_file_path = collectDataRoot + "/" + host + "/" + rrd_file;
   //TODO: handle 'file doesn't exist'. rrd.info calls back with info={} on errors.
   rrd.info(rrd_file_path, function(info) {
      callback(null, info);
   }); 
}
/**
* Takes rrdtool outpoot and transforms it to d3 data
*  rrdtool output: time: value[0],value[1],value[2]... (see output.txt for a sample)
*  d3 data [{key:key, value[]}...] (see d3 or nvd3 samples)
*/
var formatOutput = function (data) {
   // split by lines
   var lines = data.split('\n');
   // parse out the keys from the header line
   var keys = lines[0].split(/[\s,]+/);
   // create d3 friendly output data structure
   var res = [];
   for (var k=1; k< keys.length; k++) {
      res.push({ key: keys[k], values: []});
   }
   // Loop lines and fill up the data points
   // TODO: figure better way to handle [nan, nan, nan]?
   // For now: assuming that 1) last line is empty, 2) the prev is time [nan,nan,nan...]
   for (var i = 2; i < (lines.length-2); i++) {
      var s1 = lines[i].split(/:\s+/);
      var t = s1[0];
      if (s1[1] == null) continue;
      var values = s1[1].split(/\s+/);
      for (var v=0; v<values.length; v++) {
         res[v].values.push([t,values[v]]);
      }
   }
   return res;
};

/**
* Iterates all 'host' folders under collectd data root, and calls info on the specified rrd file,
* and returns an array of results [{host:hostname,info:data}...]
* @param path - path to the .rrd file in collectd structure, relative to "host" directory
* @param info - list of rrd info keys which we need values for
* @param callback(err, data) - calls with (err, null) on error, and (null, data)
* where data is an array of info outputs. 
*/
var getInfoForAllHosts = function (path, keys, callback) {
   fs.readdir(collectDataRoot, function(err, filenames){
      if (err) {
         callback(err);
      } else {
         var d =[];
         // CAREFUL! make sure cb() is called for each item!
         // Using async.each is prone to missing cb() call on some code paths,
         // which results in no call to a final callback 
         async.each(filenames, function(host, cb) {
            var dir = collectDataRoot + "/" + host;
            var filepath = [collectDataRoot, host, path].join("/");

            fs.stat(dir, function(err, stat){
               if(stat.isFile()) {
                  console.log("WARNING: [%s] not a directory, ignoring...", host);
                  cb();
               } else {
                  fs.exists(filepath, function(exists){
                     if (!exists) {
                        console.log("WARNING: %s doesn't exist", filepath);
                        cb();
                     } else {
                        infoRRD(path, host, function(err, info) {
                           if (err) { 
                              cb(err); 
                           } else {
                              var data = [host];
                              keys.forEach(function(key, i) {
                                 if (info.hasOwnProperty(key)) {
                                    data.push(info[key]);
                                 }
                              });
                              d.push(data);
                              cb();
                           }
                        });
                     }
                  });
               }
            })
         }, function (err, data) {
            callback(err, d);
         });
      }
   });
}


/* Quick & dirty testing */
// infoRRD("crap", "localhost", function(info) {
//    console.log(info);
// });
// var resmock = { json: function (data) {
//    console.log(JSON.stringify(data, null, 2));
// }};
// var nextmock = function(err) { console.log(err); }
// var reqmock = { params: { id:"localhost_fucked"}, query:{from: 1367470900, to: 1367477900, r:1000} };
// getMemory(reqmock,resmock, nextmock);

// getInfoForAllHosts("load/load.rrd", ["ds[shortterm].value", "last_update"], function(err, data) {
//    if (!err) {
//       console.log(data);
//       console.log(data.length);
//    } else {
//       console.log("ERROR: ", err);
//    }
// });



