/**
 * @fileoverview Main server for city-hero application
 */

// Requires libraries
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

// Configure our express server
app.configure(function() {
    app.set('view engine', 'ejs');
    app.set('view options', { layout: false });
    app.use(express.static(__dirname + '/../static'));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ 'secret': app.custom.auth.session.secret}));
    app.use(form({ keepExtensions: true }));
    app.use(app.router);
});

// Configure according to environment
app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
app.configure('production', function() {
    app.use(express.errorHandler()); 
});

// Set up the database connection
var conn = new (cradle.Connection)(auth.db.host, auth.db.port);

// Initialize the models with the database conneciton
models.Projects.init(conn, 'projects');
models.Users.init(conn, 'users');

// Get the routes
routes.setRoutes(app, controllers);

if (process.env.NODE_ENV !== 'test') {
    // Listen on port 8080 for DotCloud
    app.listen(settings.sitePort);
    console.log('Server started on port: ' + settings.sitePort);
}

exports.app = app;

