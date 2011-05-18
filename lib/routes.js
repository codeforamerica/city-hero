/**
 * @fileoverview Main routes for city-hero application
 */
var controllers = require('./controllers');
var views = require('./views');

/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
var set_routes = function(app) {
    // Home page
    app.get('/', function(req, res) {
        views.HomePage.getView(req, res, function(homepage_context) {
            prepareContext(req, res, app, homepage_context, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });
    
    // Project add page
    app.get('/projects/add', function(req, res) {
        views.CreateProjectForm.getView(req, res, function(form_context) {
            prepareContext(req, res, app, form_context, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });

    // Project add wizard
    app.get('/projects/wizard', function(req, res) {
        views.ProjectWizard.getView(function(wizard) {
            prepareContext(req, res, app, wizard, function(context) {
                res.render('layout.ejs', context);
            });
        });
    });

    // Project specifc page
    app.get('/projects/:pid', function(req, res) {
        var context = {};
        context = routesSetGlobalContext(app, context);
        var site_context = controllers.Site.get_context(req, res);
        var auth_context = controllers.Auth.get_context(req, res);
        var sess_context = controllers.Session.get_context(req, res, app);
        
        controllers.Projects.get_project(req, res, function(err, project_context) {
            project_context['project']['_id'] = pid;
            context = combine(context, site_context, auth_context, project_context, sess_context);

            // Views and context
            context.pageTitle = project_context.project.title;
            context.bodyClasses = ['sidebar-layout', 'project', 'project-view', 'project-' + pid];
            context.sidebarContent = [
                'partials/partial.project-sidebar.ejs'
            ];
            context.titleContent = [
                'partials/partial.project-subtitle.ejs',
                'partials/partial.project-progress.ejs'
            ];
            context.contentMain = ['pages/content.project.ejs'];
            res.render('layout.ejs', context);
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
};

/**
 * Get global context
 */
var routesSetGlobalContext = function(app, context) {
    return combine(app.custom.settings, context);
}

/**
 * Prepare the context to be applied to a template.  This includes adding in the
 * globally relevant content like session information etc.
 */
function prepareContext(req, res, app, contexts, callback) {
    var firstContext = 3
      , contexts = (contexts instanceof Array) ? contexts : [contexts]
      , global_context = routesSetGlobalContext(app, {})
      , site_context = controllers.Site.get_context(req, res)
      , auth_context = controllers.Auth.get_context(req, res)
      , full_context = {}
    
    controllers.Session.get_context(req, res, app, function(sess_context) {
        contexts.unshift(global_context);
        contexts.unshift(site_context);
        contexts.unshift(auth_context);
        contexts.unshift(sess_context);
        
        full_context = combine.apply(this, contexts);
        callback(full_context);
    });
}

/**
 * This is a simple combine method.  I don't know what pitfalls there are here
 * yet, I just want something that works.
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
