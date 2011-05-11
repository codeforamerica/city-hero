/**
 * @fileoverview Main server for city-hero application
 */

// Get our custom module paths
//require.paths.unshift('.');

// Requires libraryies
var express = require('express');
var cradle = require('cradle');
var form = require('connect-form');

// Requires custom modules
var routes = require('./routes');
var models = require('./models');

// Requires settings
var settings = require('./settings/settings.js');
var auth = require('./settings/auth.js');

// Create express-based server
var app = express.createServer();

// Define static directory (CSS and images)
app.use(express.static(__dirname + '/static'));

// Use the body parser
app.use(express.bodyParser());

// Use the form parser middleware
app.use(form({ keepExtensions: true }));

// Set options for views/templates
app.set('view options', {
    layout: false
});

// Set up the database connection
var conn = new (cradle.Connection)(auth.db.host, auth.db.port);

// Initialize the models with the database conneciton
models.Projects.init(conn, 'projects');

// Get the routes
routes.set_routes(app);

// Listen on port 8080 for DotCloud
app.listen(settings.sitePort);
console.log('Server started on port: ' + settings.sitePort);
