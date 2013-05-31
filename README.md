# Showing stats with collectd + d3js

## Install dependencies: 

1. Install [rrdtool](http://oss.oetiker.ch/rrdtool). On Mac, [homebrew](http://mxcl.github.io/homebrew/) works. On Linux, use apt-get rrdtool. On Windows, figure this out yourself (and add instructions here). Make sure rrdtool is on the path (try $which rrdtool, $rrdtool).

1. Get dependencies: 

		$cd node, npm install
		    

If rrdtool is not installed, the node_rrd will fail to build. The "mock" data should still work.

## Unit tests
Node unit tests - see node/README.md.
Browser unit tests - not implemented yet.

## Run: 

From collectd3 root: 
	
	$ node node/server.js

## Ongoing


### Statistics
* The meaning of the metric is defined on the node backend. E.g., given MIN,MAX,AVE, shortterm/medterm/longterm on CPU load, it decides what to return when frontend is querying for "load". It also forms the data into d3 friendly data structre. 

### Use of node_rrd
Looks like node_rrd gets installed right once rrdtool is properly installed and it's headers and lib files are on the path. I use node_rrd for info - when calling multiple files many times, saving on parsing. I use rrdtool via execFile for fetch - may switch to rrd_tool when it implements a single callback with all the data parsed and done. 



