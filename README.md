# Showing stats with collectd + d3js

## Install dependencies: 

Get dependencies: 

		$cd node, npm install
		    
Install [rrdtool](http://oss.oetiker.ch/rrdtool). On Mac, [homebrew](http://mxcl.github.io/homebrew/) works. On Linux, use apt-get rrdtool. On Windows, figure this out yourself. Make sure rrdtool is on the path (try $which rrdtool, $rrdtool).

If rrdtool is not installed, the "mock" data will still work.


## Run: 

From collectd3 root: 
	
	$ node node/server.js

## Ongoing
Experimenting with project structure.

There are 2 apps in apps: d3raw - raw d3js, and d3dangle, to play with dangle, the angular d3 directives.

# Statistics
* The meaning of the metric is defined on the node backend. E.g., given MIN,MAX,AVE, shortterm/medterm/longterm on CPU load, it decides what to return when frontend is querying for "load". It also forms the data into d3 friendly data structre. 

# Shelfed - node_rrd
I tried to use node_rrd module first, but decided to switch to launch rrdtool via execFile, before we know performance IS a problem. If/when we get back to using node_rrd: it's not in npm registry yet, so here are instructions:

2. get and build [node_rrd](https://github.com/Orion98MC/node_rrd). Follow instructions! It needs rrdtool properly installed and configured to compile the bindings.
3. Place a compiled version of node_rrd under node, as node/node_rrd.
NOTE: I will need to add a compiled version to the repo till it is in npm.



