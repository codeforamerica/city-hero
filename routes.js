/**
 * @fileoverview Main routes for city-hero application
 */

/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
function set_routes(app, controllers) {  
    // Home
    app.get('/', function(req, res) {
        var site_context = controllers.Site.get_context(req, res);
        var auth_context = controllers.Auth.get_context(req, res);

        controllers.Session.get_context(req, res, app, function(sess_context) {
            var context = context || {};
        
            // Facebook setup (this needs to be abstracted out)
            controllers.Projects.get_all_projects(req, res, function(err, projects_context) {
                var context = combine(site_context
                                    , auth_context
                                    , sess_context
                                    , projects_context);
                res.render('home.view.ejs', context);
            });
        });

    });
    
    // Project add page
    app.get('/projects/add', function(req, res) {
        res.render('project-add.view.ejs');
    });

    // Project page (this is currently just an example)
    app.get('/projects/:pid', function(req, res) {
        var site_context = controllers.Site.get_context(req, res);
        var auth_context = controllers.Auth.get_context(req, res);
        
        controllers.Projects.get_project(req, res, function(err, project_context) {
            project_context['project']['_id'] = pid;
            var context = combine(site_context
                                , auth_context
                                , project_context);
            console.log('about to render!');
            console.log(context);
            res.render('project.view.ejs', context);
        });
    });
    
    // Handle the POST of a new project
    app.post('/projects/add', function(req, res) {
        controllers.Projects.create_project(req, res, function(err, context) {
            res.redirect('/projects/'+context.id);
        });
    });
};

/* This is a simple combine method.  I don't know what pitfalls there are here
 * yet, I just want something that works.
 */
combine = function(/* context1, context2, ... */) {
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
