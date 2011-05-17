/**
 * @fileoverview Main server for city-hero application
 */

// Get our custom module paths
//require.paths.unshift('.');

// Requires libraryies
var connect = require('connect');
var express = require('express');
var cradle = require('cradle');
var form = require('connect-form');
var fbsdk = require('facebook-sdk');
var step = require('step');

// Requires custom modules
var routes = require('./routes');
var models = require('./models');
var controllers = require('./controllers');

// Requires settings
var settings = require('./settings/settings.js');
var auth = require('./settings/auth.js');

// Global variables (good?)
var facebook;

// Create express-based server
var app = express.createServer();

// Attach things to application (good?)
app.custom = app.custom || {};
app.custom.fbsdk = fbsdk;
app.custom.auth = auth;
app.custom.settings = settings;
app.custom.connect = connect;

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
routes.set_routes(app, controllers);

if (process.env.NODE_ENV !== 'test') {
    // Listen on port 8080 for DotCloud
    app.listen(settings.sitePort);
    console.log('Server started on port: ' + settings.sitePort);
}

exports.app = app;

