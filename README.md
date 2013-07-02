# Showing stats with collectd + d3js

## Install dependencies: 

1. Install [rrdtool](http://oss.oetiker.ch/rrdtool). On Mac, [homebrew](http://mxcl.github.io/homebrew/) works. On Linux, use apt-get install rrdtool, apt-get install librrd-dev. On Windows, figure this out yourself (and add instructions here). Make sure rrdtool is on the path (try $which rrdtool, $rrdtool).

1. Get node dependencies: 

		$cd node
		$npm install
		    

## Unit tests

Node unit tests:

* by npm (a script is configured in package.json)

    	$cd node
    	$npm test

* or manually 

		env NODE_ENV=test node_modules/.bin/mocha -R spec

Browser unit tests - not implemented yet.

## Configure
Open `node/configure/default.yml`. Modify data-directory to point out to collectd files. Change the port of web app. Define and adjust host categoreis (use regular expressions). 

* TODO: put comments into default.yml.

For more info, see comments in default.yml and [config documentation](http://lorenwest.github.io/node-config/latest/)

## Run: 

From collectd3 root: 
	
	$ cd node
	$ node server.js

## Ongoing





