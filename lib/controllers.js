/**
 * @fileoverview Controllers for projects.
 */

var models = require('./models');
var auth = require('./settings/auth.js');
var settings = require('./settings/settings.js');
var https = require('https');

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
    }
}

/**
 * Projects controller
 */
exports.projects = {
    
    /**
     * Retrieve a project.
     * @param {Request} The reqeust object.
     * @param {Response} The response object.
     * @param {Function} The callback.  Accepts a context object as a parameter.
     */
    get: function(pid, callback) {
        models.Projects.get(pid, function(err, project) {
            if (err) {
                console.error(err);
                callback(err, null);
            }
            if(project.creator && project.creator !== "undefined") {
                models.Users.get(project.creator, function(err, user) {
                    if(err) {
                        console.error(err);
                        callback(err, null);
                    }
                    project.creatorData = user;
                    var context = {project: project};
                    callback(err, context);
                    
                });
            } else {
                project.creatorData = { username: 'Charles Norris', _id : '#'}
                var context = {project: project};
                callback(err, context);
            }
        })
    },
    
    all: function(callback) {
        models.Projects.all(function(err, docs) {
            var project
              , projects = [];
            
            if (err) {
                console.error(err);
                callback(err, null);
            }
            
            for (project_key in docs) {
                project = docs[project_key].doc;
                projects.push(project);
            }
            callback(err, {projects: projects});
        });
    },
    
    create_project: function(req, res, callback) {
        if(req.form) {
            req.form.complete(function(err, fields, files){
                // TODO : validate this stuff!!
                project = {
                    title: fields['project-title'],
                    description: fields['project-description'] || fields['project-mission'],
                    location: fields['project-location'],
                    creator: fields['project-creator'],
                    geometry: {
                        "type": "Point",
                        "coordinates": [
                            fields['project-lon'],
                            fields['project-lat']
                        ]
                    },
                    link: fields['project-link'],
                    _attachments: files                    
                }
                
//console.log(files);
                
                // If our images are not going into the couch - do some parallel
console.log('before the save' + fields)
                models.Projects.save(project, function(err, resp) {
console.log('during the save' + resp)
                    callback(err, resp);
console.log('after the save')
                });
            });
        }
    },
    
    updateProject: function(req, res, callback) {
        if(req.form) {
            req.form.complete(function(err, fields, files){
                // TODO : validate this stuff!!
                project = {
                    _id: fields._id,
                    title: fields.title,
                    description: fields.description,
                    _attachments: files                    
                }
                
                console.log(files);
                
                // If our images are not going into the couch - do some parallel
                models.Projects.save(project, function(err, resp) {
                    callback(err, resp);
                });
            });
        }
    }
};

/**
 * Users controller
 */
exports.users = {
    
    get: function(uid, callback) {
        models.Users.get(uid, function(err, user) {
            if (err) {
                console.error(err)
                callback(err, null);
            }
            
            var context = {user: user};
            callback(err, context);
        })
    },
    
    all: function(callback) {
        models.Users.all(function(err, docs) {
            var users = [];
            
            if (err) {
                console.error(err);
                callback(err, null);
            }
            
            for (userID in docs) {
                users.push(docs[userID].doc);
            }
            callback(err, {users: users});
        });
    },
    
    createUser: function(req, res, callback) {
        var user = (req.params) ? req.params : {};
        
        if (user.username && user.password) {
            // Hash the password
            user.password = require('crypto').createHash('md5').update(user.password).digest("hex");

            // Handle attachments
            user._attachments = req.params.files;

            // Remove unnecessary values
            delete user.password_confirm;
            delete user.email_confirm;
            delete user.submit;
            
            // Save user
            models.Users.save(user, function(err, resp) {
                callback(err, resp);
            });
        }
        else {
            callback({}, {});
        }
    },
    
    /**
     * Checks for existing username.  Express middleware format.
     */
    checkUsername: function() {
        return function (req, res, next) {
            var submittedUsername = req.params.username || false;
            
            // Get all, it would make more sense to create a view for this.
            models.Users.all(function(err, users) {
                var found = false;
                for (var u in users) {
                    if (users[u].doc.username == submittedUsername) {
                        found = true;
                    }
                }
                
                // If found, make form as invalid and write message.
                if (found) {
                    req.from = req.from || {};
                    req.from.isValid = false;
                    req.form.errors = req.form.errors || [];
                    req.form.errors.push('Username already exists.  Please choose a new one.');
                }
                
                next();
            });
        }
    }
};

