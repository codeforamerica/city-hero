/**
 * @fileoverview EXAMPLE: Holds authentication information
 * and should not be versioned.  See auth.example.js
 *
 * Copy this to auth.js and update values.
 */

// For db connection
exports.db = {
    host: '127.0.0.1',
    port: '5984',
    username: '',
    password: ''
};

// For facebook connection
exports.fb = {
    appId: '',
    secret: ''
};

// For sessions
exports.session = {
    secret: ''
}