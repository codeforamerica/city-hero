/**
 * @fileoverview Main routes for city-hero application
 */
var controllers = require('controllers');
var settings = require('settings/settings');
var auth = require('settings/auth');
var https = require('https');
var http = require('http');
var utils = require('utils');

// Contexts that we will need
var context = require('context');

/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
exports.setRoutes = function(app) {
    /**
     * Create a function that returns the given parameters in a list.  This is used
     * to create a middleware function from other middleware functions.
     */
    function joinMiddleware(/* filter1, filter2, ... */) {
        var argarray = [].slice.call(arguments);
        return (function () { return argarray; });
    }

    /**
     * Create middleware types.  For isntance,
     * form pages, default pages, search pages, etc
     * Order matters.
     */
    var defaultPageContext = joinMiddleware(
        exports.middleGlobalContext(), 
        controllers.session.middleSessionContext()
    );
    
    // var restrictedPage = joinMiddleware(
    //    defaultPageContext(), 
    //    subControllers.session.requireLogin()
    //);
    
    var formPageContext = joinMiddleware(
        defaultPageContext(), 
        exports.middleForm()
    );
    
    var authenticatedPageCntlr = joinMiddleware(
        controllers.users.hasAccess(['authenticated'])
    );
    
    var anonymousPageCntlr = joinMiddleware(
        controllers.users.notLoggedIn()
    );
    
    // Home page
    app.get('/', defaultPageContext(), context.pages.home(), function(req, res) {
        res.render('layout.ejs', res.context);
    });

    // Project pages
    app.get('/projects/wizard', formPageContext(), context.projects.wizard(), authenticatedPageCntlr(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.post('/projects/wizard', authenticatedPageCntlr(), function(req, res) {
        controllers.projects.create_project(req, res, function(err, context) {
            res.redirect('/projects/' + context.id);
        });
    });
    
    app.get('/projects/:pid', defaultPageContext(), context.projects.details(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.get('/projects/edit/:pid', defaultPageContext(), context.projects.edit(), 
        authenticatedPageCntlr(), controllers.projects.editOwn(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    
    app.post('/projects/edit/:pid', exports.middleForm(), context.projects.instance(),
        authenticatedPageCntlr(), controllers.projects.editOwn(), function(req, res) {
        controllers.projects.updateProject(req, res, function(err, context) {
            res.redirect('/projects/edit/' + context.id);
        });
    });
    
    // User pages
    var middleProfile = [
        defaultPageContext(),
        context.users.isOwn(),
        context.users.profile(),
        context.users.findWay()
    ];
    app.get('/profile/:uid', middleProfile, function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.get('/profile/edit/:uid', middleProfile, context.users.ownerOnly(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    var middleProfilePost = [
        middleProfile,
        context.users.ownerOnly(),
        exports.middleForm(),
        controllers.users.validateProfile(),
        controllers.users.saveProfile()
    ];
    app.post('/profile/edit/:uid', middleProfilePost, function(req, res) { /* Handled by save */ });
    
    app.get('/user/register', defaultPageContext(), context.users.register(), anonymousPageCntlr(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    
    var middleRegister = joinMiddleware(
        exports.middleForm(),
        controllers.users.validateRegistration(),
        defaultPageContext(),
        anonymousPageCntlr(),
        context.users.registerPost()
    );
    
    app.post('/user/register', middleRegister(), function(req, res) { /* Handled in registerPost */ });
    app.get('/user/login', defaultPageContext(), context.users.login(), anonymousPageCntlr(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.post('/user/login', function(req, res) {
        controllers.session.loginUser(req, res, function(err, context) {
            var redirect = (req.session.userLoggedIn) ? '/profile/' + req.session.user.username : '/user/login';
            res.redirect(redirect);
        });
    });
    app.get('/logout', controllers.session.logout(), defaultPageContext(), function(req, res) {
        res.redirect('/');
    });
    
    // Facebook handling
    app.get('/auth/facebook', context.users.facebook.auth(), function(req, res) { /* Handled in view */ });
    app.get('/auth/:provider/callback', context.users.facebook.callback(), function(req, res) {
        /* Handled by view */
    });
    
    /**
     * This section handles the search functionality, then passes the results to the homepage.
     */
    app.get('/search', defaultPageContext(), context.pages.home(), function(req, res) {
        var q = req.query.q;
        
        // Handle the elasticsearch
        if(settings.searchMethod === 'es') {
            // Setup connection information for 
            var options = {
                host: auth.elasticsearch.host,
                port: auth.elasticsearch.port,
                method: 'GET',
                path:'/projects/projects/_search?q=_all:'+q
            };
            
            // GET the search results
            http.request(options, function(esResp) {
                var raw = '';
                
                // Piece together the response
                esResp.on('data', function(chunk) { raw += chunk; });
                
                esResp.on('end', function() {
                    var data = JSON.parse(raw);             
                    
                    // Add the search results to the homepage context
                    res.context.searchQuery = q;
                    res.context.searchResults = data.hits;
                    
                    // Render the page
                    res.render('layout.ejs', res.context);
                    
                });
            }).on('error', function(e) {
                console.error(e);
            }).end();
        } else {
            // Allow for other search methods here...
        }
    });
};

/**
 * Global context.  Context is used for templates.
 */  
exports.middleGlobalContext = function() {
    return function (req, res, next) {
        // Define the context
        res.context = res.context || {};
        
        // Global contexts
        res.context.settings = require('./settings/settings.js');
        res.context.auth = require('./settings/auth.js');
        // Allow settings to be used directly as well
        res.context = utils.combine(res.context, res.context.settings);
        
        // Get messages
        res.context.messages = controllers.session.renderMessages(req, res);
        
        // Set up client-side scripts
        res.context.scripts = res.context.scripts || []
        res.context.scripts.push('/js/city-hero.js');

        // Keep going
        next();
    };
}

/**
 * Handle forms for middleware.
 */  
exports.middleForm = function() {
    return function (req, res, next) {
        // Check form and complete (get data and fields)
        if (req.form) {
            req.form.complete(function(err, fields, files) {
                // Put fields in params so that the validator can check it out.
                if (req.params) {
                    req.params = utils.combine(req.params, fields);
                }
                else {
                    req.params = fields;
                }
                req.params.files = files;
                
                // Put values in response context
                res.context = res.context || {};
                res.context.form = res.context.form || {};
                res.context.form.fields = fields;
                res.context.form.files = files;
                
                // Keep going
                next();
            });
        }
        else {
            next();
        }
    }
};
