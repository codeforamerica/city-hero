/**
 * @fileoverview Main server for city-hero application
 */
 
// Set paths for easier requires
require.paths.splice(0, require.paths.length);
require.paths.unshift(
    __dirname + '/lib',
    __dirname
);

// Requires libraries
var connect = require('connect');
var express = require('express');
var cradle = require('cradle');
var form = require('connect-form');

// Requires custom modules and settings
var routes = require('./routes');
var models = require('./models');
var auth = require('./settings/auth');
var settings = require('./settings/settings');

// Create express-based server and configure
var app = express.createServer();
app.configure(function() {
    app.set('view engine', 'ejs');
    app.set('view options', { layout: false });
    app.use(express.static(__dirname + '/../static'));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ 'secret': auth.session.secret}));
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
routes.setRoutes(app);

if (process.env.NODE_ENV !== 'test') {
    // Listen on port 8080 for DotCloud
    app.listen(settings.sitePort);
    console.log('Server started on port: ' + settings.sitePort);
}
exports.app = app;