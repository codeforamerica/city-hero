/**
 * @fileoverview Main routes for city-hero application
 */
var controllers = require('./controllers');
var views = require('./views');
var https = require('https');
var http = require('http');
var Oauth2 = require('./oauth2');
var settings = require('./settings/settings.js');
var auth = require('./settings/auth.js');

/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
exports.setRoutes = function(app) {
    // Create middleware types.  For isntance,
    // form pages, default pages, search pages, etc
    // Order matters.
    //
    // Not sure how to reference route correctly from req or res.  Ideally
    // we could use the route directly within views.middlePageContext(),
    // but instead we explicitely have to communicate the route.
    var defaultPage = [
        exports.middleGlobalContext(), 
        controllers.session.middleSessionContext()
    ];
    // var restrictedPage = [defaultPage, subControllers.session.requireLogin()];
    var formPage = [defaultPage, exports.middleForm()];
    
    // Home page
    app.get('/', defaultPage, views.pages.home(), function(req, res) {
        res.render('layout.ejs', res.context);
    });

    // Project pages
    app.get('/projects/wizard', formPage, views.projects.wizard(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.post('/projects/wizard', function(req, res) {
        controllers.projects.create_project(req, res, function(err, context) {
            res.redirect('/projects/' + context.id);
        });
    });
    app.get('/projects/:pid', defaultPage, views.projects.details(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.get('/projects/edit/:pid', defaultPage, views.projects.edit(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.post('/projects/edit/:pid', function(req, res) {
        controllers.projects.updateProject(req, res, function(err, context) {
            res.redirect('/projects/edit/' + context.id);
        });
    });
    
    // User pages
    app.get('/profile/:uid', defaultPage, views.users.profile(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.get('/user/register', defaultPage, views.users.register(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    var middleRegister = [
        exports.middleForm(),
        controllers.users.validateRegistration(),
        defaultPage,
        views.users.registerPost(),
    ];
    app.post('/user/register', middleRegister, function(req, res) { /* Handled in registerPost */ });
    app.get('/user/login', defaultPage, views.users.login(), function(req, res) {
        res.render('layout.ejs', res.context);
    });
    app.post('/user/login', function(req, res) {
        controllers.session.loginUser(req, res, function(err, context) {
            var redirect = (req.session.userLoggedIn) ? '/profile/' + req.session.user._id : '/user/login';
            res.redirect(redirect);
        });
    });
    app.get('/logout', controllers.session.logout(), defaultPage, function(req, res) {
        res.redirect('/');
    });
    
    // Facebook handling
    app.get('/auth/facebook', views.facebook.auth(), function(req, res) { /* Handled in view */ });
    app.get('/auth/:provider/callback', views.facebook.callback(), function(req, res) {
        /* Handled by view */
    });
    
    /**
     * This section handles the search functionality, then passes the results to the homepage.
     */
    app.get('/search', defaultPage, views.pages.home(), function(req, res) {
        var q = req.query.q;
        
        // Handle the elasticsearch
        if(settings.searchMethod === 'es') {
            // Setup connection information for 
            var options = {
                host: auth.elasticsearch.host,
                port: auth.elasticsearch.port,
                path:'/projects/projects/_search?q=_all:'+q
            };
            
            // GET the search results
            http.get(options, function(esResp) {
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
            });
        } else {
            // Allow for other search methods here...
        }
    });
};

/**
 * Global context.  Context is used for templates.
 */  
exports.middleGlobalContext = function() {
    var utils = require('./utils');
    
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
    var utils = require('./utils');
    
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
