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
exports.login = function() {
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
exports.register = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.formBuilder = models.Users.formDescriber();
        res.context.pageTitle = 'Register';
        res.context.bodyClasses = ['user', 'user-register'];
        res.context.contentMain = ['partials/partial.form-builder.ejs'];
    
        next();
    }
}

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
}
