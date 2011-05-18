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
    },
    
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
                console.error(err)
                callback(err, null);
            }
            
            var context = {project: project};
            callback(err, context);
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
        if (req.form) {
            req.form.complete(function(err, fields, files) {
                // Hash the password
                var pass = require('crypto').createHash('md5').update(fields['user-password']).digest("hex");
            
                // TODO : validate this stuff!!
                var user = {
                    username: fields['user-username'],
                    password: pass,
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            fields['user-location-lon'],
                            fields['user-location-lat']
                        ]
                    },
                    _attachments: files                    
                }
                // If our images are not going into the couch - do some parallel
                models.Users.save(user, function(err, resp) {
                    callback(err, resp);
                });
            });
        }
    }
};

