# Showing stats with collectd + d3js

## Install dependencies: 

1. cd node, npm install (gets the dependencies)
2. get and build [node_rrd](https://github.com/Orion98MC/node_rrd). Follow instructions! It needs rrdtool properly installed and configured to compile the bindings.
3. Place a compiled version of node_rrd under node, as node/node_rrd.

NOTE: For now, I am adding a compiled version of node_rrd to the repo.



## Run: 

From collectd3 root: 
	
	$ node node/server.js

## Ongoing
Experimenting with project structure.

There are 2 apps in apps: d3raw - raw d3js, and d3dangle, to play with dangle, the angular d3 directives.

