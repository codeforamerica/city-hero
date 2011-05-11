/**
 * @fileoverview Main server for city-hero application
 */

// Get our custom module paths
//require.paths.unshift('.');

// Requires
var express = require('express');
var cradle = require('cradle');
var routes = require('./routes');
var models = require('./models');

// Create express-based server
var app = express.createServer();

// Define static directory (CSS and images)
app.use(express.static(__dirname + '/static'));

// Set options for views/templates
app.set('view options', {
    layout: false
});

// Set up the database connection
var conn = new (cradle.Connection)('127.0.0.1','5984');

// Initialize the models with the database conneciton
models.Projects.init(conn, 'projects');

// Get the routes
routes.set_routes(app);

// Listen on port 8080 for DotCloud
app.listen(8080);
console.log('Server started on port 8080');
