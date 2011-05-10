/**
 * Main city hero server.
 */

// Get our custom module paths
require.paths.unshift(__dirname + '/node_modules/express');
require.paths.unshift(__dirname + '/node_modules/express/lib');
require.paths.unshift(__dirname + '/node_modules/connect');
require.paths.unshift(__dirname + '/node_modules/connect/lib');

// Requires
require('express');