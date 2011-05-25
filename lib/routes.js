/**
 * @fileoverview Main routes for city-hero application
 */
var controllers = require('./controllers');
var views = require('./views');
var https = require('https');
var http = require('http');
var Oauth2 = require('./oauth2');

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
    
    
    
    
    
    app.get('/auth/facebook', function(req, res){
        var host = req.headers.host
        var client_id = auth.fb.appId;
        var provider = 'facebook';
        var redirect_uri = 'http://' + host + '/auth/facebook/callback';

        res.redirect('https://www.facebook.com/dialog/oauth?client_id=' + client_id + '&redirect_uri='+ redirect_uri); 
    });
    
    app.get('/auth/:provider/callback', function(req, res){
        var host = req.headers.host
        if (req.params.provider === "facebook") {
            var oauth2 = new OAuth2({
                host: "graph.facebook.com",
                accessTokenPath: "/oauth/access_token",
                clientId: auth.fb.appId,
                clientSecret: auth.fb.secret
              });

            oauth2.getAccessToken(req.query.code,'http://' + host + '/auth/facebook/callback', function(error, result) {
                if(error) {
                    console.error(error);
                } else {
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
    });
    
    app.get('/search', defaultPage, views.pages.home(), function(req, res) {
        var q = req.query.q;
        
        if(settings.searchMethod === 'es') {
            var options = {
                host: auth.elasticsearch.host,
                port: auth.elasticsearch.port,
                path:'/projects/projects/_search?q=description:'+q
            };
            console.log(options);
            http.get(options, function(esResp) {
                var raw = '';
                esResp.on('data', function(chunk) {
                    raw += chunk;
                });
                
                esResp.on('end', function() {
                    var data = JSON.parse(raw);             
                    
                    res.context.searchQuery = q;
                    res.context.searchResults = data.hits;
                    res.render('layout.ejs', res.context);
                    
                });
            }).on('error', function(e) {
                console.error(e);
            });
        } else {
            // Do the simple js search stuff
        }
    });
};

/**
 * Prepare the context to be applied to a template.  This includes adding in the
 * globally relevant content like session information etc.
 */
function prepareContext(req, res, app, contexts, callback) {
    var settings = require('./settings/settings.js');
    var auth = require('./settings/auth.js');

    var firstContext = 3;
    var contexts = (contexts instanceof Array) ? contexts : [contexts];
    var appContext = app.custom.settings;
    var siteContext = { settings: settings };
    var authContext = { auth: auth };
    var context = {};

    controllers.session.getSessionContext(req, res, app, function(sessContext) {
        contexts.unshift(appContext);
        contexts.unshift(siteContext);
        contexts.unshift(authContext);
        contexts.unshift(sessContext);
        context = combine.apply(this, contexts);
        
        // Get messages
        context.messages = controllers.session.renderMessages(req, res);
        
        // Set up client-side scripts
        context.scripts = context.scripts || []
        context.scripts.push('/js/city-hero.js');

        // Check for req context
        if (req.context) {
            context = combine(req.context, context);
        }
        
        // Check for form values
        callback(context);
    });
}

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
        res.context = combine(res.context, res.context.settings);
        
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
                    req.params = combine(req.params, fields);
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

/**
 * Take a number of objects and merge them into one.  In case of conflicts, the
 * attributes in the later objects will take precedence over the earlier ones.
 * This is useful for constructing a complete view context from several smaller
 * ones.
 */
var combine = function(/* context1, context2, ... */) {
    var combined_context = {},
        contexts = arguments,
        context_index,
        curr_context,
        key;
    
    for (context_index in contexts) {
        curr_context = contexts[context_index];
        for (key in curr_context) {
            combined_context[key] = curr_context[key];
        }
    }
    
    return combined_context;
}
