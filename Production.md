#How to deploy to production, on Linux

Tested on Ubuntu 12.04

##Pre-requisits: 

* [node js 0.8 or later](http://nodejs.org/)
* [npm 1.2.x](https://npmjs.org)
* [rrdtool](http://oss.oetiker.ch/rrdtool/)
* librrd-dev - for node_rrd, to build node bindings (on Ubuntu, apt-get install librrd-dev)
* access to your collectd data directory

##Get the files: 
	$wget https://github.com/dzimine/collectd3/archive/master.zip
	$unzip master.zip
	$mv collectd3-master collectd3
	$cd collectd3
	$npm install --production

Must be ok. If there are error, it will say 'not ok' on the last line.  

One known problem may happen on npm install, fix pending…

Temp fix: build node_rrd independently and copy it over under collectd3/node/node_modules

	$git clone https://github.com/dzimine/node_rrd.git
	$cd node_rrd
	$npm install
	$cd ..
	$cp -r node_rrd collectd3/node/node_modules/rrd


##Configure: 

Edit collectd3/node/config/default.yml

*  port: 9000 # web server port
*  data-directory: sampledata # a path to collectd data root directory

##Run:

from collected directory - 

	$cd node
	$node server.js