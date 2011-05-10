/**
 * @fileoverview Main server for city-hero application
 */

// Get our custom module paths
require.paths.unshift('.');

// Requires
var express = require('express');
var routes = require('routes');

// Create express-based server
var app = express.createServer();

// Define static directory (CSS and images)
app.use(express.static(__dirname + '/static'));

// Set options for views/templates
app.set('view options', {
    layout: false
});

// Get the routes
routes.set_routes(app);

// Listen on port 8080 for DotCloud
app.listen(8080);

