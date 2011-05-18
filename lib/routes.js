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
var set_routes = function(app) {
    // Home page
    app.get('/', function(req, res) {
        views.homePage(function(homepage_context) {
            prepareContext(req, res, app, homepage_context, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
    
    app.get('/logout', function(req, res) {
        controllers.Session.logout(req, res, app);
    });

    // Project add wizard
    app.get('/projects/wizard', function(req, res) {
        views.projectWizard(function(wizard) {
            prepareContext(req, res, app, wizard, function(context) {
                res.render('layout.ejs', context);
            });
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

    // Profile page for user
    app.get('/profile/:uid', function(req, res) {
        var context = {};
        context = routesSetGlobalContext(app, context);
        var site_context = controllers.Site.get_context(req, res);
        var auth_context = controllers.Auth.get_context(req, res);
        var sess_context = controllers.Session.get_context(req, res, app);
        context = combine(context, site_context, auth_context, sess_context);

        // TODO: Get profile
        var uid = req.params.uid

        // Views and context
        context.pageTitle = 'Profile for ' + uid;
        context.bodyClasses = ['sidebar-layout', 'profile', 'profile-view', 'profile-' + uid];
        context.sidebarContent = [
            'partials/partial.general-location.ejs'
        ];
        context.contentMain = ['pages/content.profile.ejs'];
        res.render('layout.ejs', context);
    });
    
    // User add page
    app.get('/user/register', function(req, res) {
        views.userRegister(req, res, function(viewContext) {
            prepareContext(req, res, app, viewContext, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
    
    // Handle the POST of a new project
    app.post('/user/register', function(req, res) {
        controllers.Users.createUser(req, res, function(err, context) {
            res.redirect('/profile/' + context.id);
        });
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
    
    controllers.session.getFacebook(req, res, app, function(sess_context) {
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

// Publicize functions
exports.set_routes = set_routes;
