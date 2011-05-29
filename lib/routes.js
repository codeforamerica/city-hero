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
var pagesContext = require('context/pages');
var projectsContext = require('context/projects');
var usersContext = require('context/users');

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
    app.get('/', defaultPageContext(), pagesContext.home(), function(req, res) {
        res.render('layout.ejs', res.context);
    });

    // Project pages
    app.get('/projects/wizard', formPageContext(), projectsContext.wizard(), authenticatedPageCntlr(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.post('/projects/wizard', authenticatedPageCntlr(), function(req, res) {
        controllers.projects.create_project(req, res, function(err, context) {
            res.redirect('/projects/' + context.id);
        });
    });
    
    // Project pages for National Night Out
    app.get('/templates/:tid/wizard', 
        defaultPageContext(),
        authenticatedPageCntlr(), 
        function (req, res) {
            res.render('layout.ejs', res.context);
        });
    
    app.get('/projects/:pid', defaultPageContext(), projectsContext.details(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.get('/projects/edit/:pid', defaultPageContext(), projectsContext.edit(), 
        authenticatedPageCntlr(), controllers.projects.editOwn(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.post('/projects/edit/:pid', 
        authenticatedPageCntlr(), controllers.projects.editOwn(), function(req, res) {
        controllers.projects.updateProject(req, res, function(err, context) {
            res.redirect('/projects/edit/' + context.id);
        });
    });
    
    // User pages
    app.get('/profile/:uid', defaultPageContext(), controllers.users.isOwn(), usersContext.profile(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.get('/user/register', defaultPageContext(), usersContext.register(), anonymousPageCntlr(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    
    var middleRegister = joinMiddleware(
        exports.middleForm(),
        controllers.users.validateRegistration(),
        defaultPageContext(),
        anonymousPageCntlr(),
        usersContext.registerPost()
    );
    
    app.post('/user/register', middleRegister(), function(req, res) { /* Handled in registerPost */ });
    app.get('/user/login', defaultPageContext(), usersContext.login(), anonymousPageCntlr(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.post('/user/login', function(req, res) {
        controllers.session.loginUser(req, res, function(err, context) {
            var redirect = (req.session.userLoggedIn) ? '/profile/' + req.session.user._id : '/user/login';
            res.redirect(redirect);
        });
    });
    app.get('/logout', controllers.session.logout(), defaultPageContext(), function(req, res) {
        res.redirect('/');
    });
    
    // Facebook handling
    app.get('/auth/facebook', usersContext.facebook.auth(), function(req, res) { /* Handled in view */ });
    app.get('/auth/:provider/callback', usersContext.facebook.callback(), function(req, res) {
        /* Handled by view */
    });
    
    /**
     * This section handles the search functionality, then passes the results to the homepage.
     */
    app.get('/search', defaultPageContext(), pagesContext.home(), function(req, res) {
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
