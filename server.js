/**
 * Main city hero server.
 */

// Must listen on port 8080 for DotCloud

// Get our custom module paths
//require.paths.unshift(__dirname + '/node_modules/express');

// Requires
require('express');

// Testing hello world
var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(8080, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8080/');