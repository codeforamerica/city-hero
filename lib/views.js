/**
 * @fileoverview Views for projects.  Overall, we are setting
 * res.context which will be passed to template file.
 */
var utils = require('./utils');

/**
 * General pages
 */
exports.pages = {};

/**
 * Home page
 */
exports.pages.home = function() {
    return function (req, res, next) {
        var controllers = require('./controllers');
        
        res.context = res.context || {};
        res.context.pageTitle = 'Welcome to City Hero';
        res.context.bodyClasses = ['front', 'home'];
        res.context.contentMain = ['pages/content.home.ejs'];
        res.context.searchQuery = '';
        res.context.searchResults = {};
        res.context.searchResults.hits = [];
        
        controllers.projects.all(function(err, projects) {
            res.context = utils.combine(res.context, projects);
            next();
        });
    };
}

/**
 * Project pages
 */
exports.projects = {};

/**
 * Project wizad page.
 */
exports.projects.wizard = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.pageTitle = 'Start a Project';
        res.context.bodyClasses = ['project', 'project-wizard'];
        res.context.contentMain = ['pages/content.project-wizard.ejs'];
        next();
    }
}

/**
 * Projects details page
 */
exports.projects.details = function() {
    return function (req, res, next) {
        var controllers = require('./controllers');
        
        res.context = res.context || {};
        res.context.bodyClasses = ['sidebar-layout', 'project', 'project-view', 'project-' + req.params.pid];
        res.context.sidebarContent = [
            'partials/partial.project-metrics-sidebar.ejs',
            'partials/partial.project-location-sidebar.ejs',
            'partials/partial.project-owner-sidebar.ejs'
        ];
        res.context.titleContent = [
            'partials/partial.project-subtitle.ejs',
            'partials/partial.project-progress.ejs'
        ];
        res.context.contentMain = ['pages/content.project.ejs'];
        
        // Get project
        controllers.projects.get(req.params.pid, function(err, project) {
            if (err && !project) {
                console.error('ControllerError for project with id: ' + req.params.pid);
                console.error(err);
                next();
            }
            else {
                res.context = utils.combine(res.context, project);
                res.context.pageTitle = project.project.title;
                res.context.project._id = req.params.pid;
                res.context.project.supporters = project.supporters || []
        
                // Check if user is logged in and owner of project
                if (res.context.session.userLoggedin && res.context.project.creator 
                    && res.context.session.user._id === res.context.project.creator) {
                    res.context.sidebarContent.unshift('partials/partial.project-editbox.ejs');
                }
                next();
            }
        });
    }
}

/**
 * Project edits page
 */
exports.projects.edit = function() {
    return function (req, res, next) {
        var controllers = require('./controllers');
        
        res.context = res.context || {};
        res.context.pageTitle = ['partials/partial.project-title'];
        res.context.bodyClasses = ['sidebar-layout', 'project', 'project-edit', 'project-' + req.params.pid];
        res.context.sidebarContent = [
            'partials/partial.project-metrics-sidebar.ejs',
            'partials/partial.project-location-sidebar.ejs',
            'partials/partial.project-owner-sidebar.ejs'
        ];
        res.context.titleContent = [
            'partials/partial.project-subtitle.ejs',
            'partials/partial.project-progress.ejs'
        ];
        res.context.contentMain = ['pages/content.project-edit.ejs'];
        
        // Get project
        controllers.projects.get(req.params.pid, function(err, project) {
            if (err && !project) {
                console.error('ControllerError for project with id: ' + req.params.pid);
                console.error(err);
                next();
            }
            else {
                res.context = utils.combine(res.context, project);
                res.context.project._id = req.params.pid;
                res.context.project.supporters = project.supporters || []
                next();
            }
        });
    }
}

/**
 * User pages
 */
exports.users = {};

/**
 * Profile page
 */
exports.users.profile = function() {
    return function (req, res, next) {
        var controllers = require('./controllers');
        
        res.context = res.context || {};
        res.context.bodyClasses = ['sidebar-layout', 'profile', 'profile-view', 'profile-' + req.params.uid];
        res.context.sidebarContent = ['partials/partial.general-location.ejs'];
        res.context.contentMain = ['pages/content.profile.ejs'];
    
        // Get User
        controllers.users.get(req.params.uid, function(err, user) {
            res.context = utils.combine(res.context, user);
            res.context.user._id = req.params.uid;
            res.context.pageTitle = 'Profile for ' + user.user.username;
            next();
        });
    }
}

/**
 * User register login
 */
exports.users.login = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.pageTitle = 'Login';
        res.context.bodyClasses = ['user', 'user-login'];
        res.context.contentMain = ['pages/content.user-login.ejs'];
        next();
    }
}

/**
 * User register form
 */
exports.users.register = function() {
    return function (req, res, next) {
        var controllers = require('./controllers');
        var models = require('./models');
        
        res.context = res.context || {};
        res.context.formBuilder = models.Users.formDescriber();
        res.context.pageTitle = 'Register';
        res.context.bodyClasses = ['user', 'user-register'];
        res.context.contentMain = ['partials/partial.form-builder.ejs'];
    
        if (controllers.session.isLoggedIn(req, res)) {
            res.redirect('/');
            next();
        }
        else {    
            next();
        } 
    }
}

/**
 * User register form post
 */
exports.users.registerPost = function() {
    return function (req, res, next) {
        var controllers = require('./controllers');
        var models = require('./models');
        res.context = res.context || {};

        if (!req.form.isValid) {
            for (var n in req.form.errors) {
                controllers.session.setMessage(req, res, req.form.errors[n]);
            }
            res.context.formBuilder = models.Users.formDescriber();
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
console.log(context);
                req.session.user = context;
                req.session.userLoggedIn = true;
                controllers.session.setMessage(req, res, 'Successfully logged in.');
                
                if (context.id) {
                    res.redirect('/profile/' + context.id);
                }
                else {
                    res.redirect('/');
                }
                next();
            });
        }
    }
}

/**
 * Facebook handling pages
 */
exports.facebook = {};

/**
 * Facebook auth page that intializes authentication
 */
exports.facebook.auth = function() {
    var auth = require('./settings/auth.js');
    
    return function (req, res, next) {
        var host = req.headers.host
        var client_id = auth.fb.appId;
        var provider = 'facebook';
        var redirect_uri = 'http://' + host + '/auth/facebook/callback';

        res.redirect('https://www.facebook.com/dialog/oauth?client_id=' + client_id + '&redirect_uri='+ redirect_uri);
    }
}

/**
 * Facebook auth page that intializes authentication
 */
exports.facebook.callback = function() {
    var auth = require('./settings/auth.js');
    var controllers = require('./controllers');
    
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
                            res.redirect('/profile/' + req.session.user._id);
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
}
