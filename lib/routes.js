/**
 * @fileoverview Main routes for city-hero application
 */
var controllers = require('./controllers');
var views = require('./views');
var settings = require('./settings/settings');
var auth = require('./settings/auth');
var https = require('https');
var Oauth2 = require('./oauth2');

/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
exports.setRoutes = function(app) {
    var eForm = require('express-form');
    var filter = eForm.filter;
    var validate = eForm.validate;
    
    // Create middleware types.  For isntance,
    // form pages, default pages, search pages, etc
    // Order matters.
    var defaultPage = [
        exports.middleGlobalContext(), 
        controllers.session.middleSessionContext(), 
        views.middlePageContext()
    ];
    var formPage = [defaultPage, exports.middleForm()];
    
    // Home page
    app.get('/', defaultPage, function(req, res) {
        res.render('layout.ejs', res.context);
    });
    
/*
    // Home page
    app.get('/', function(req, res) {
        views.homePage(function(homepage_context) {
            prepareContext(req, res, app, homepage_context, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
*/

    // Project add wizard
    app.get('/projects/wizard', function(req, res) {
        views.projectWizard(function(wizard) {
            prepareContext(req, res, app, wizard, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
    
    app.post('/projects/wizard', function(req, res) {
        controllers.projects.create_project(req, res, function(err, context) {
            res.redirect('/projects/'+context.id);
        });
    });
    
    // Project add page
    app.get('/projects/add', function(req, res) {
        views.projectForm(req, res, function(form_context) {
            prepareContext(req, res, app, form_context, function(context) {       
                res.render('layout.ejs', context);
            });
        });
    });
    
    // Handle the POST of a new project
    app.post('/projects/add', function(req, res) {
        controllers.projects.create_project(req, res, function(err, context) {
            res.redirect('/projects/'+context.id);
        });
    });
    
    // Project specifc edit page
    app.get('/projects/edit/:pid', function(req, res) {
        var pid = req.params.pid;
        views.projectDetailsEditPage(pid, function(page) {
            prepareContext(req, res, app, page, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
    
    // Project specifc edit page
    app.post('/projects/edit/:pid', function(req, res) {
        controllers.projects.updateProject(req, res, function(err, context) {
            res.redirect('/projects/edit/'+context.id);
        });
    });
    
    // Project specifc page
    app.get('/projects/:pid', function(req, res) {
        var pid = req.params.pid;

        views.projectDetailsPage(pid, function(page) {
            prepareContext(req, res, app, page, function(context) {        
                // Not sure is this is the best way to do this...
                if(context.session.userLoggedin && context.project.creator && context.session.user._id === context.project.creator) {
                    context.sidebarContent.unshift('partials/partial.project-editbox.ejs');
                }
                
                res.render('layout.ejs', context);
            });
        });
    });
    
    // Profile page for user
    app.get('/profile/:uid', function(req, res) {
        var uid = req.params.uid;
        
        views.profileDetailsPage(uid, function(page) {
            prepareContext(req, res, app, page, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
    
    // User add page
    app.get('/user/register', function(req, res) {
        if (controllers.session.isLoggedIn(req, res)) {
            res.redirect('/');
        }
        else {    
            views.userRegister(req, res, function(viewContext) {
                prepareContext(req, res, app, viewContext, function(context) {
                    res.render('layout.ejs', context);
                });
            });
        }
    });

    // Handle the POST of a new user register.  Note custom validation 
    // does not work for express-form (WTF).  Use custom middle wear.
    var middle = [
        exports.middleForm(),
        eForm(
            validate('username', 'User name').required().isAlphanumeric(),
            validate('email', 'Email').required().isEmail(),
            validate('password', 'Password').required().isAlphanumeric(),
            validate('password_confirm', 'Password Confirmation').required().equals('field::password'),
            validate('email_confirm', 'Email Confirmation').required().equals('field::email')
        ),
        controllers.users.checkUsername()
    ];
    app.post('/user/register', middle, function(req, res) {
        if (!req.form.isValid) {
            for (var n in req.form.errors) {
                controllers.session.setMessage(req, res, req.form.errors[n]);
            } 
            views.userRegister(req, res, function(viewContext) {
                prepareContext(req, res, app, viewContext, function(context) {
                    res.render('layout.ejs', context);
                });
            });
        }
        else {
            controllers.users.createUser(req, res, function(err, context) {
                if (context.id) {
                    res.redirect('/profile/' + context.id);
                }
                else {
                    res.redirect('/');
                }
            });
        }
    });
    
    // User login page
    app.get('/user/login', function(req, res) {
        views.userLogin(req, res, function(viewContext) {
            prepareContext(req, res, app, viewContext, function(context) {
//console.log(context);
                res.render('layout.ejs', context);
            });
        });
    });
    
    // Handle the POST of user login
    app.post('/user/login', function(req, res) {
        controllers.session.loginUser(req, res, function(err, context) {
            if (req.session.userLoggedIn) {
                res.redirect('/profile/' + req.session.user._id);
            }
            else {
                res.redirect('/user/login');
            }
        });
    });

    // Logout page
    app.get('/logout', function(req, res) {
        controllers.session.logout(req, res, app);
        // some osrt of messge
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
//                console.log(result);
                if(error) {
                    console.error(error);
                } else {
                    // Do stuff with the access token (we are authenticated at this point)
                    var accessToken = result.split('=')[1];
                    
                    controllers.session.loginUser(req, res, accessToken, function(err, context) {
console.log(req.session);                        
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
};

/**
 * Prepare the context to be applied to a template.  This includes adding in the
 * globally relevant content like session information etc.
 */
function prepareContext(req, res, app, contexts, callback) {
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
