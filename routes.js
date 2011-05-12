/**
 * @fileoverview Main routes for city-hero application
 */

controllers = require('./controllers');
 
/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
function set_routes(app) {  
    // Home
    app.get('/', function(req, res) {
        var context = context || {};
        
        // Facebook setup (this needs to be abstracted out)
        facebook = new app.custom.fbsdk.Facebook({
            appId: app.custom.auth.fb.appId,
            secret: app.custom.auth.fb.secret,
            request: req,
            response: res
        });
        
        // Check if logged in
        var loginLink = '';
        if (facebook.getSession()) {
            console.log('logged in');
            facebook.api('/me', function(me) {
                fbid = me.id;
                console.log(fbid);
                context.loginHref = facebook.getLoginUrl();
                context.loginTitle = 'Log Out';
                res.render('home.view.ejs', context);
            });
        } 
        else {
            console.log('not logged in');
            //  If the user is not logged in, just show them the login button.
            context.loginHref = facebook.getLoginUrl();
            context.loginTitle = 'Login with Facebook';
            res.render('home.view.ejs', context);
        }

        // HACK: I moved the function below into each of the if blocks above - this seems 
        //       redundant so we need to come back and fix this.
        //res.render('home.view.ejs', context);
        
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
