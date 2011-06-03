/**
 * @fileoverview Context for Users
 */
var utils = require('utils');
var controllers = require('controllers');
var models = require('models');
var auth = require('settings/auth');
var OAuth2 = require('oauth2').OAuth2;

/**
 * Profile page
 */
exports.profile = function() {
    return function (req, res, next) {
        var editing = (req.url.indexOf('edit') > 0) ? true : false;
        var class = (editing) ? 'profile-edit' : 'profile-view';
        
        res.context = res.context || {};
        res.context.bodyClasses = ['sidebar-layout', 'profile', class, 'profile-' + req.params.uid];
        res.context.sidebarContent = ['partials/partial.profile-location-sidebar.ejs'];
        res.context.contentMain = ['pages/content.profile.ejs'];

        // Determine editing parts
        if (editing) {
            res.context.editable = res.context.editable || {};
            res.context.editable.is = true;
            res.context.editable.id = 'profile-form';
            res.context.editable.action = req.url;
            res.context.scripts.push('/js/wayfinder-profile.js');
        }
        else {
            res.context.editable = null;
        }
        if (res.context.isOwnUserProfile) {
            res.context.sidebarContent.unshift('partials/partial.profile-wayfinder-sidebar.ejs');
        }
        if (res.context.isOwnUserProfile && !editing) {
            res.context.sidebarContent.unshift('partials/partial.profile-editbox.ejs');
        }

        // Get User
        controllers.users.get(req.params.uid, function(err, user) {
            res.context = utils.combine(res.context, user);
            res.context.pageTitle = 'Profile for ' + user.user.username;
            next();
        });
    }
};

/**
 * User register login
 */
exports.login = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.pageTitle = 'Login';
        res.context.bodyClasses = ['user', 'user-login'];
        res.context.contentMain = ['pages/content.user-login.ejs'];
        next();
    }
};

/**
 * User register form
 */
exports.register = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.formBuilder = models.users.formDescriber();
        res.context.pageTitle = 'Register';
        res.context.bodyClasses = ['user', 'user-register'];
        res.context.contentMain = ['partials/partial.form-builder.ejs'];
    
        next();
    }
};

/**
 * User register form post
 */
exports.registerPost = function() {
    return function (req, res, next) {
        res.context = res.context || {};

        if (!req.form.isValid) {
            for (var n in req.form.errors) {
                controllers.session.setMessage(req, res, req.form.errors[n]);
            }
            res.context.formBuilder = models.users.formDescriber();
            res.context.pageTitle = 'Register';
            res.context.bodyClasses = ['user', 'user-register'];
            res.context.contentMain = ['partials/partial.form-builder.ejs'];
            
            // Get messages, since we are so late in the stack
            res.context.messages = controllers.session.renderMessages(req, res);
            
            res.render('layout.ejs', res.context);
            next();
        }
        else {
            controllers.users.createUser(req, res, function(err, context) {
                // Re-jig the returned user so that our session.user uses _id & _rev
                context._id = context.id;
                context._rev = context.rev;
                delete context.id;
                delete context.rev;
                
                req.session.user = context;
                req.session.userLoggedIn = true;
                controllers.session.setMessage(req, res, 'Successfully logged in.');
                
                if (context.username) {
                    res.redirect('/profile/' + context.username);
                }
                else {
                    res.redirect('/');
                }
                next();
            });
        }
    }
};

/**
 * Allow only owner
 */
exports.ownerOnly = function() {
    return function(req, res, next) {
        if (res.context.isOwnUserProfile) {
            // For editing, put user values in form if it does exist.
            res.context.form = res.context.form || {};
            res.context.form.fields = res.context.form.fields || res.context.user;
            next();
        }
        else {
            controllers.session.setMessage(req, res, 'You do not have access to this page.');
            res.redirect('/');
        }
    }
};

/**
 * Get WayFinder data
 */
exports.findWay = function() {
    return function(req, res, next) {
        if (res.context.isOwnUserProfile) {
            controllers.users.findWay(req.params.uid, function(err, steps) {
                res.context.steps = steps;
                next();
            });
        }
        else {
            next();
        }
    }
}
    
/**
 * Middle ware for checking if profile is the users
 */
exports.isOwn = function() {
    return function(req, res, next) {
        var isOwn = false;
        req.params = req.params || {};

        // The project should already be attached to the context
        if (req.session.user) {
            if (req.params.uid == req.session.user.username) {
                isOwn = true;
            }
        }
        
        if (isOwn) {
            res.context.isOwnUserProfile = true;
            
            // Get step information
            res.context.steps = models.users.steps(); 
        }
        
        next();
    }
};


/**
 * Facebook handling pages
 */
exports.facebook = {};

/**
 * Facebook auth page that intializes authentication
 */
exports.facebook.auth = function() {
    return function (req, res, next) {
        var host = req.headers.host
        var client_id = auth.fb.appId;
        var provider = 'facebook';
        var redirect_uri = 'http://' + host + '/auth/facebook/callback';

        res.redirect('https://www.facebook.com/dialog/oauth?client_id=' + client_id + '&redirect_uri='+ redirect_uri);
    }
};

/**
 * Facebook auth page that intializes authentication
 */
exports.facebook.callback = function() {
    return function (req, res, next) {
        var host = req.headers.host
        
        // Ensure page is provided from facebook
        if (req.params.provider === "facebook") {
            var oauth2 = new OAuth2({
                host: "graph.facebook.com",
                accessTokenPath: "/oauth/access_token",
                clientId: auth.fb.appId,
                clientSecret: auth.fb.secret
            });
            var callbackURL = 'http://' + host + '/auth/facebook/callback';

            // Get oath token
            oauth2.getAccessToken(req.query.code, callbackURL, function(error, result) {
                if (error) {
                    console.error(error);
                }
                else {
                    // Do stuff with the access token (we are authenticated at this point)
                    var accessToken = result.split('=')[1];
                    
                    controllers.session.loginUser(req, res, accessToken, function(err, context) {                     
                        if (req.session.userLoggedIn) {
                            res.redirect('/profile/' + req.session.user.username);
                        }
                        else {
                            res.redirect('/user/login');
                        }
                    });
                }
            });  
        }
        else {
            res.redirect('/');
        }
    }
};

/**
 * Get projects owned by project
 */
exports.getProjectsOwned = function() {
    return function(req, res, next) {
        models.projects.getByCreator(res.context.user._id, function(objects) {
            res.context.projectsOwned = objects;
            next();
        });
    };
};

/**
 * Get projects owned by project
 */
exports.getProjectsSupported = function() {
    return function(req, res, next) {
        models.projects.getBySupporter(res.context.user._id, function(objects) {
            res.context.projectsSupported = objects;
            next();
        });
    };
};