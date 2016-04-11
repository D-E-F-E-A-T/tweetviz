/*jslint node: true */
'use strict';

var tag = process.argv[2];
if (tag == undefined) {
    console.error("[ERROR] The tag is missing, precise one.");
    process.exit(1);
} else {
    console.info("{INFO} '%s' will be tracked.", tag);
}

var http = require('http');
var express = require('express');
var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);
var Twitter = require('twitter');

var client = new Twitter({
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
});

app.use(express.static(__dirname + '/static'));

var PORTNUM = 5000;

server.listen(PORTNUM, function(){
    console.info('{INFO} Server runs on port %d', PORTNUM);
});

function getLocation(addr, tweetMsg){

    addr = addr.split(' ').join('-');
    var path = '/search?q='+addr+'&format=json';

    var options = {
	host: 'nominatim.openstreetmap.org',
	path: path
    };

    http.get(options, function(res) {
	var bodyChunks = [];

	res.on('data', function(chunk) {
	    bodyChunks.push(chunk);
	}).on('end', function() {
	    var body = Buffer.concat(bodyChunks);
	    if (body != null){
		var body_json = [];

		try {
		    body_json = JSON.parse(body);
		    body_json[0]["tweetMsg"] = tweetMsg;
		} catch (e) {
		    console.error("[WARNING] Cannot parse to JSON: %s", e.message);
		}

		if (body_json.length > 0){
		    io.sockets.emit('point', body_json[0]);
		} else {
		    console.info("{INFO} Location '%s' not found.", addr);
		}

	    }
	});

    }).on('error', function(e) {
	console.error("[WARNING] An error occured when requesting openstreetmap: %s", e.message);
    });

};

client.stream('statuses/filter', {track: tag}, function(stream) {

    stream.on('data', function(tweet) {

	if (tweet.place !== null) {
	    getLocation(tweet.place.name, tweet.text);
	} else {
	    if (tweet.user.location)
		getLocation(tweet.user.location, tweet.text);
	}

    });
    
    stream.on('error', function(e) {
	console.error('[ERROR] An error occured during streaming from Twitter: ', e.message);
	throw error;
    });

});
