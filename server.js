/**
 * Main city hero server.
 */

// Must listen on port 8080 for DotCloud

// Get our custom module paths
//require.paths.unshift(__dirname + '/node_modules/express');
require.paths.unshift('.');

// Requires
var express = require('express');
var routes = require('routes');

var app = express.createServer();
app.use(express.static(__dirname + '/static'));
app.set('view options', {
    layout: false
});

routes.set_routes(app);

app.listen(8080);

