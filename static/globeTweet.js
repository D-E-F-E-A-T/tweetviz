/*jslint node: true */
'use strict';

function globeTweet(cfg) {
    var socket = io();
    var width = cfg.width, height = cfg.height;

    var projection = d3.geo.orthographic()
	.scale(475)
	.translate([width / 2, height / 2])
	.clipAngle(90)
	.precision(0.1);

    var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);

    //Create the base globe
    var backgroundCircle = svg.append("circle")
	.attr('cx', width / 2)
	.attr('cy', height / 2)
	.attr('r', projection.scale())
	.attr('class', 'globe');

    var path = d3.geo.path().projection(projection)
	.pointRadius(3);

    var g = svg.append("g");

    var tooltip = d3.select('body').append('div')
        .attr('class', 'hidden tooltip');

    // load and display the World
    d3.json("world-110m2.json", function(error, topology) {
	
	var cities = [];
	var animated = true;

	// enable/disable globe rotation compared to mouse position
	d3.selectAll("svg")
	    .on("mouseenter", function() {animated=false;})
	    .on("mouseleave", function() {animated=true;});

	g.selectAll("path")
	    .data(topojson.object(topology, topology.objects.countries).geometries)
	    .enter()
	    .append("path")
	    .attr("d", path);


	var feature = g.selectAll("path");

	socket.on('point', function(location) {

	    svg.selectAll("path.point").data(cities).remove();

	    cities.push(location);

	    svg.selectAll("path.point")
		.data(cities)
		.enter()
		.append("path")
		.datum(function(d) {
		    return {type: "Point",
			    coordinates: [d.lon, d.lat],
			    tweetMsg: d.tweetMsg,
			   };
		})
		.attr("class", "point")
		.attr("d", path);

	    svg.selectAll("path.point")
		.on("mouseenter", function(d) {

		    var mouse = d3.mouse(svg.node()).map(function(d) {
                        return parseInt(d);
                    });

                    tooltip.classed('hidden', false)
                        .html(d.tweetMsg);

		    console.log(mouse);
		    var box = tooltip.node().getBoundingClientRect();
		    console.log(box);

		    tooltip
			.attr('style', 'left:'+(box.width/2+mouse[0]/2)+'px;'
			      + 'top:' + (mouse[1] - 35) + 'px');
		})
		.on("mouseleave", function() {
		    tooltip.classed('hidden', true)
		    .html("");
		});
	});

	var velocity = cfg.velocity, then = Date.now();

	d3.timer(function() {

	    if (animated) {
    		var rotate = velocity * (Date.now() - then);

    		var circles = svg.selectAll("path.point");

    		projection.rotate([rotate]);

    		feature.attr("d", path);
    		circles.attr("d", path);
	    }

	});

    });
}
