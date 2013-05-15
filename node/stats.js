function panic(err) { 
	console.log(err);
	exit();
}

var rrd = require('./node_rrd/lib/rrd');
if (rrd == null) panic();


var filename = "sampledata/load.rrd";
//var filename = "../rrd/test.rrd";
rrd.info(filename, function(info) {
	console.log("RRD ", info.filename, "last updated on ", info.last_update);
}); 

var resolution = 5000;
var period = 12000; /* seconds */
var last_update = 1367470912;
// round up times to resolutions
var t1 = Math.round(last_update / resolution) * resolution;
var t0 = Math.round((last_update - period)/ resolution) * resolution;
console.log ("period: ", t0, t1);

// rrdtool fetch load.rrd AVERAGE --start 1367470912 --end 1367477912
// start and end must be multipe of desired resolution, to use the right RRA
rrd.fetch(filename,  
	//{ cf: "AVERAGE", start: t1-5000, end: t1, resolution:10 }, 
    { cf: "AVERAGE", start: t0, end: t1, resolution:resolution }, 
	function(time, data) {
		console.log(time, data);
})