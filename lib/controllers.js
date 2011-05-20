/**
 * @fileoverview Controllers for projects.
 */

var models = require('./models');
var auth = require('./settings/auth.js');
var settings = require('./settings/settings.js');

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
     * Old facebook login stuff, needs to be integrated with new session stuff.
     */
    getFacebook: function(req, res, app, callback) {
        var context = {}
          , facebook;
        
        facebook = new app.custom.fbsdk.Facebook({
            appId: app.custom.auth.fb.appId,
            secret: app.custom.auth.fb.secret,
            request: req,
            response: res
        });

        if(req.session.fb) {
console.log('req.session.fb exists');
            
            context.user = true
            context.actionHref = facebook.getLogoutUrl();
            context.actionTitle = 'Log Out';
            if (callback) {
                callback({session: context}); 
            } else {
                return {session: context};
            }
        } else {
        
            if (facebook.getSession()) {
                //console.log('You are logged into facebook!');
                facebook.api('/me', function(me) {
                    fbid = me.id;
                    req.session.fb = me;
                    //console.log(me);
                
                    context.user = true
                    context.actionHref = facebook.getLogoutUrl({ next: 'logout'});
                    context.actionTitle = 'Log Out';
                    if (callback) {
                        callback({session: context}); 
                    } else {
                        return {session: context};
                    }
                });
            } 
            else {
                //console.log('You are NOT logged into facebook!');
                //  If the user is not logged in, just show them the login button.
                context.user = false;
                context.actionHref = facebook.getLoginUrl({ 
                    return_session : false,
                    display : 'popup'
                });
                context.actionTitle = 'Login with Facebook';
                if (callback) {
                    callback({session: context}); 
                } else {
                    return {session: context};
                }
            }
        }
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
    loginUser: function(req, res, callback) {
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
            if(project.creator) {
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
                    description: fields['project-description'],
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
                
                console.log(files);
                
                // If our images are not going into the couch - do some parallel
                models.Projects.save(project, function(err, resp) {
                    callback(err, resp);
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
    }
};

