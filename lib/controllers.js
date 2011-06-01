/**
 * @fileoverview Controllers for projects.
 */

var models = require('./models');
var auth = require('./settings/auth.js');
var settings = require('./settings/settings.js');
var https = require('https');
var utils = require('./utils');

/**
 * Session controller
 */
exports.session = {
    logout:  function() {
        return function (req, res, next) {
            exports.session.setMessage(req, res, 'You have been successfully logged out.');
            req.session.fb = null;
            req.session.user = null;
            req.session.userLoggedIn = null;
            next();
        }
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
     * Session context, middleware version.
     */
    middleSessionContext: function() {
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
            } else {
                if(project.creator && project.creator !== "undefined") {
                    models.Users.get(project.creator, function(err, user) {
                        if(err) {
                            console.error(err);
                            callback(err, null);
                        }
                        project.owner = user;
                        var context = {project: project};
                        callback(err, context);
                    
                    });
                } else {
                    var context = {project: project};
                    callback(err, context);
                }
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
                    slug: utils.slugify(fields['project-title']),
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
                var project;
                
                // TODO : validate this stuff!!
                if (fields.action && fields.action === 'setowner') {
                    // TODO: need to check whether there's an owner already, 
                    //       and put a message in the queue that you can't own
                    //       a project that's already owned: "This project 
                    //       already has an owner."
                    project = {
                        _id: fields._id,
                        creator: fields.owner
                    }
                } else {
                    project = {
                        _id: fields._id,
                        title: fields.title,
                        description: fields.description,
                        _attachments: files                    
                    }
                }
                
                // If our images are not going into the couch - do some parallel
                models.Projects.save(project, function(err, resp) {
                    callback(err, resp);
                });
            });
        }
    },
    
    /**
     * Middle ware for checking if use can edit own project
     */
    editOwn: function() {
        return function(req, res, next) {
            var allowed = false;

            // The project should already be attached to the context
            if (res.context.project && res.context.project.owner._id == req.session.user._id) {
                allowed = true;
            }
            
            if (allowed) {
                next();    
            }
            else {
                exports.session.setMessage(req, res, 'You can only edit project you own.');
                res.redirect('/');
            }
        }
    }
};
