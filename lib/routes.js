/**
 * @fileoverview Main routes for city-hero application
 */
var controllers = require('./controllers');

/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
var set_routes = function(app) {
    // Home page
    app.get('/', function(req, res) {
        var context = {};
        context = routesSetGlobalContext(app, context);
        var site_context = controllers.Site.get_context(req, res);
        var auth_context = controllers.Auth.get_context(req, res);
        
        controllers.Session.get_context(req, res, app, function(sess_context) {
            var context = context || {};
console.log('in get /');
console.log(req.session);
            // Get projects
            controllers.Projects.get_all_projects(req, res, function(err, projects_context) {
                context = combine(context, site_context, auth_context, 
                    sess_context, projects_context, context);

                // Views and context
                context.pageTitle = 'Welcome to City Hero';
                context.bodyClasses = ['front', 'home'];
                context.sidebarInnerContent = ['partials/partial.sidebar-home.ejs'];
                context.contentMain = ['pages/content.home.ejs', 'partials/partial.project-slider.ejs'];
                res.render('layout.ejs', context);
            });
            
        });

    });
    
    // Project add page
    app.get('/projects/add', function(req, res) {
        var context = {};
        context = routesSetGlobalContext(app, context);
        var site_context = controllers.Site.get_context(req, res);
        var auth_context = controllers.Auth.get_context(req, res);
        var sess_context = controllers.Session.get_context(req, res, app);
        context = combine(context, site_context, auth_context, sess_context);
            
        // Views and context
        context.pageTitle = 'Add a Project';
        context.bodyClasses = ['project', 'ptoject-add'];
        context.contentMain = ['pages/content.project-add.ejs'];
        res.render('layout.ejs', context);
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
};

/**
 * Get global context
 */
var routesSetGlobalContext = function(app, context) {
    return combine(app.custom.settings, context);
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
        //console.log(curr_context);
        for (key in curr_context) {
            combined_context[key] = curr_context[key];
        }
    }
    
    //console.log(combined_context);
    return combined_context;
}

// Publicize functions
exports.set_routes = set_routes;
