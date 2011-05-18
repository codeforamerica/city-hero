/**
 * @fileoverview Main routes for city-hero application
 */
var controllers = require('./controllers');
var views = require('./views');
var settings = require('./settings/settings');
var auth = require('./settings/auth');

/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
exports.set_routes = function(app) {
    // Home page
    app.get('/', function(req, res) {
        views.homePage(function(homepage_context) {
            prepareContext(req, res, app, homepage_context, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
    

    // Project add wizard
    app.get('/projects/wizard', function(req, res) {
        views.projectWizard(function(wizard) {
            prepareContext(req, res, app, wizard, function(context) {
                res.render('layout.ejs', context);
            });
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
        controllers.Projects.create_project(req, res, function(err, context) {
            res.redirect('/projects/'+context.id);
        });
    });
    
    // Project specifc page
    app.get('/projects/:pid', function(req, res) {
        var pid = req.params.pid;
        
        views.projectDetailsPage(pid, function(page) {
            prepareContext(req, res, app, page, function(context) {
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
        views.userRegister(req, res, function(viewContext) {
            prepareContext(req, res, app, viewContext, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
    
    // Handle the POST of a new user register
    app.post('/user/register', function(req, res) {
        controllers.users.createUser(req, res, function(err, context) {
            res.redirect('/profile/' + context.id);
        });
    });
    
    // User login page
    app.get('/user/login', function(req, res) {
        views.userLogin(req, res, function(viewContext) {
            prepareContext(req, res, app, viewContext, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
    
    // Handle the POST of user login
    app.post('/user/login', function(req, res) {
        controllers.session.loginUser(req, res, function(err, context) {
            //res.redirect('/profile/' + context.id);
            res.redirect('/user/login');
        });
    });

    // Logout page
    app.get('/logout', function(req, res) {
        controllers.session.logout(req, res, app);
        // some osrt of messge
        res.redirect('/');
    });
};

/**
 * Prepare the context to be applied to a template.  This includes adding in the
 * globally relevant content like session information etc.
 */
function prepareContext(req, res, app, contexts, callback) {
    var firstContext = 3
      , contexts = (contexts instanceof Array) ? contexts : [contexts]
      , app_context = app.custom.settings
      , site_context = { settings: settings }
      , auth_context = { auth: auth }
      , full_context = {}

    controllers.session.getSessionContext(req, res, app, function(sess_context) {
        contexts.unshift(app_context);
        contexts.unshift(site_context);
        contexts.unshift(auth_context);
        contexts.unshift(sess_context);
        
        full_context = combine.apply(this, contexts);
        callback(full_context);
    });
}

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
