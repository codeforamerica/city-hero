/**
 * Session controller
 */
exports.session = {
    logout: function(req, res, qpp, callback) {
        req.session.fb = null;
        req.session.user = null;
    },
    
    /**
     * Set messages (also returns messages)
     *
     * Messages are used to communicate to user.  These
     * are set on sessions as they are messages, such as login
     * failure.
     */
    setMessage: function(req, res, message, callback) {
        var callback = callback || function(req, res, messages) { return messages };
        req.session.messages = req.session.messages || [];
        
        // Add new message
        req.session.messages.push(message);
        
        return callback(req, res, req.session.messages);
    },
    
    /**
     * Render messages
     *
     * This returns current messages then clears the messages
     * in the session.  This is good when you want to output
     * to user.
     */
    renderMessages: function(req, res, callback) {
        var callback = callback || function(req, res, messages) { return messages };
        var sessionMessages = req.session.messages = req.session.messages || [];
        
        // clear messages.
        req.session.messages = [];
        
        return callback(req, res, sessionMessages);
    },
    
    /**
     * Get session context
     */
    getSessionContext: function(req, res, qpp, callback) {
        var context = {};
        var callback = callback || function(context) { return context };
        
        // TODO, put facebook integration in here.
        
        // Check if user is logged in.
        if (req.session.user && req.session.user.username) {
            context.userLoggedin = true
            context.actionHref = '/logout';
            context.actionTitle = 'Log Out';
            context.user = req.session.user;
        }
        else {
            context.userLoggedin = false;
            context.actionHref = '/user/login';
            context.actionTitle = 'Login';
            context.user = {};
        }
        
        return callback({ session: context });
    },
    
    /**
     * Session context, middleware version.
     */
    middleSessionContext : function() {
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
    },
    
    /**
     * User login, ie create session.
     */
    loginUser: function(req, res, /* [fbAccessToken, ] */ callback) {
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
                fbRes.on('data', function(fbResData) {
                    req.session.user = {};
               
                    // Get all, it would make more sense to create a view for this.
                    models.Users.all(function(err, users) {
                        // See if the user exists in our db
                        for (var u in users) {
                            var current = users[u].doc;
                            if (current.fbAccessToken && current.fbAccessToken == accessToken) {
                                // User found
                                req.session.user = users[u].doc;
                                req.session.userLoggedIn = true;
                                exports.session.setMessage(req, res, 'Successfully logged in.  Welcome back.');
                            }
                        }
                        
                        // If we didn't find the user, create them
                        if (!req.session.user || !req.session.user.username) {
                            // HACK - make this happen better
                            var fbUserDoc = JSON.parse(fbResData.toString('utf8'));
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
                                files: []}

                            exports.users.createUser(fakeReq, res, function(err, context) {
                                res.redirect('/profile/' + context._id);
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
    },
    
    /**
     * Check if user is logged in
     */
    isLoggedIn: function(req, res) {
        if (req.session.userLoggedIn && req.session.user) {
            return true;
        }
        return false;
    },
    
    /**
     * Requie that user is logged in.  At some point, there
     * should be rols.
     */
    requireLogin: function() {
        return function (req, res, next) {
            if (isLoggedIn(req, res)) {
                next();
            }
            else {
                res.redirect('/');
                next();
            }
        }
    }
}