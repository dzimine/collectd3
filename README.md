# Showing stats with collectd + d3js

Install dependencies, so far: 
1) cd node, npm install (gets the dependencies)
2) get and build [node_rrd](https://github.com/Orion98MC/node_rrd)
3) copy a compiled version of node_rrd under node, as node/node_rrd (TODO: refine this)


Run: from collectd3 root, call: node node/server.js

Experimenting with project structure; 

There are 2 apps in apps: d3raw - raw d3js, and dangle, the angular d3 directives.

