/**
 * Session controller
 */

exports.logout = function() {
    return function (req, res, next) {
        exports.session.setMessage(req, res, 'You have been successfully logged out.');
        req.session.fb = null;
        req.session.user = null;
        req.session.userLoggedIn = null;
        next();
    }
}

/**
 * Set messages (also returns messages)
 *
 * Messages are used to communicate to user.  These
 * are set on sessions as they are messages, such as login
 * failure.
 */
exports.setMessage = function(req, res, message, callback) {
    var callback = callback || function(req, res, messages) { return messages };
    req.session.messages = req.session.messages || [];
    
    // Add new message
    req.session.messages.push(message);
    
    return callback(req, res, req.session.messages);
}

/**
 * Render messages
 *
 * This returns current messages then clears the messages
 * in the session.  This is good when you want to output
 * to user.
 */
exports.renderMessages = function(req, res, callback) {
    var callback = callback || function(req, res, messages) { return messages };
    var sessionMessages = req.session.messages = req.session.messages || [];
    
    // clear messages.
    req.session.messages = [];
    
    return callback(req, res, sessionMessages);
}

/**
 * Session context, middleware version.
 */
exports.middleSessionContext = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.session = res.context.session || {};

        // Check if user is logged in.
        if (req.session.user && req.session.user.username) {
            res.context.session.userLoggedin = true
            res.context.session.actionHref = '/logout';
            res.context.session.actionTitle = 'Log Out';
            res.context.session.user = req.session.user;
        }
        else {
            res.context.session.userLoggedin = false;
            res.context.session.actionHref = '/user/login';
            res.context.session.actionTitle = 'Login';
            res.context.session.user = {};
        }

        next();
    }
}

/**
 * User login, ie create session.
 */
exports.loginUser = function(req, res, /* [fbAccessToken, ] */ callback) {
    if (req.form) {
        req.form.complete(function(err, fields, files) {
            req.session.user = {};
            
            // Get all, it would make more sense to create a view for this.
            models.Users.all(function(err, users) {
                var submittedUsername = fields['user-login-username'];
                var submittedPassword = require('crypto').createHash('md5').update(fields['user-login-password']).digest("hex");
                
                for (var u in users) {
                    var current = users[u].doc;
                    if (current.username == submittedUsername && current.password == submittedPassword) {
                        // User found
                        req.session.user = users[u].doc;
                        req.session.userLoggedIn = true;
                        exports.session.setMessage(req, res, 'Successfully logged in.  Welcome back.');
                    }
                }
                
                if (!req.session.user || !req.session.user.username) {
                    exports.session.setMessage(req, res, 'User name or password not found.');
                }
                
                callback(err, users);
            });
        });
    } else {
        // Login FB users
        var accessToken;
        
        var options = [].slice.call(arguments, 2);
        callback = options.pop()
        accessToken = options.pop()

        // Get the user's facebook info
        https.get({ host: 'graph.facebook.com', path: '/me?access_token='+accessToken }, function(fbRes) {
            var raw = '';
            
            // Piece together the response
            fbRes.on('data', function(chunk) { raw += chunk; });
            
            fbRes.on('end', function() {
                var data = JSON.parse(raw); 
                req.session.user = {};

                // Get all, it would make more sense to create a view for this.
                models.Users.all(function(err, users) {
                    // See if the user exists in our db
                    for (var u in users) {
                        var current = users[u].doc;
                        if (current.fbAccessToken && current.username == data.username) {
                            // User found
                            req.session.user = users[u].doc;
                            req.session.userLoggedIn = true;
                            exports.session.setMessage(req, res, 'Successfully logged in.  Welcome back.');
                        }
                    }

                    // If we didn't find the user, create them
                    if (!req.session.user || !req.session.user.username) {
                        // HACK - make this happen better
                        var fbUserDoc = data;
                        fbUserDoc.fbAccessToken = accessToken;
                        
                        /**
                         * LOOK AT ME!  I'M A TERRIBLE PIECE OF CODE!
                         * PLEASE FIX ME NOW!  We have to set a password on
                         * the user, since facebook doesn't send one along.
                         * I'm thinking it should either be a random string
                         * or the accessToken.  I don't know whether the 
                         * access token is random enough though.
                         */
       /* ===> */       fbUserDoc.password = '12345'      /* <=== */
                        
                        var fakeReq = {
                            params: fbUserDoc,
                            files: []
                        }
                            
                        exports.users.createUser(fakeReq, res, function(err, context) {
                            res.redirect('/profile/' + context.username);
                        });
                    } else {
                        callback(err, users);
                    }
                });
            });

        }).on('error', function(e) {
            console.error(e);
        });
    }
}

/**
 * Check if user is logged in
 */
exports.isLoggedIn = function(req, res) {
    if (req.session.userLoggedIn && req.session.user) {
        return true;
    }
    
    return false;
}


