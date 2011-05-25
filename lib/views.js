/**
 * @fileoverview Views for projects.  Overall, we are setting
 * res.context which will be passed to template file.
 */
var models = require('./models');
var controllers = require('./controllers');
var utils = require('./utils');

/**
 * General pages
 */
exports.pages = {};

/**
 * Home page
 */
exports.pages.home = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.pageTitle = 'Welcome to City Hero';
        res.context.bodyClasses = ['front', 'home'];
        res.context.contentMain = ['pages/content.home.ejs'];
        res.context.searchQuery = '';
        res.context.searchResults = {};
        res.context.searchResults.hits = [];
        
        controllers.projects.all(function(err, projects) {
            res.context = utils.combine(res.context, projects);
            next();
        });
    };
}

/**
 * Project pages
 */
exports.projects = {};

/**
 * Project wizad page.
 */
exports.projects.wizard = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.pageTitle = 'Start a Project';
        res.context.bodyClasses = ['project', 'project-wizard'];
        res.context.contentMain = ['pages/content.project-wizard.ejs'];
        next();
    }
}

/**
 * Projects details page
 */
exports.projects.details = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.bodyClasses = ['sidebar-layout', 'project', 'project-view', 'project-' + req.params.pid];
        res.context.sidebarContent = [
            'partials/partial.project-metrics-sidebar.ejs',
            'partials/partial.project-location-sidebar.ejs',
            'partials/partial.project-owner-sidebar.ejs'
        ];
        res.context.titleContent = [
            'partials/partial.project-subtitle.ejs',
            'partials/partial.project-progress.ejs'
        ];
        res.context.contentMain = ['pages/content.project.ejs'];
        
        // Get project
        controllers.projects.get(req.params.pid, function(err, project) {
            if (err && !project) {
                console.error('ControllerError for project with id: ' + req.params.pid);
                console.error(err);
                next();
            }
            else {
                res.context = utils.combine(res.context, project);
                res.context.pageTitle = project.project.title;
                res.context.project._id = req.params.pid;
                res.context.project.supporters = project.supporters || []
        
                // Check if user is logged in and owner of project
                if (res.context.session.userLoggedin && res.context.project.creator 
                    && res.context.session.user._id === res.context.project.creator) {
                    res.context.sidebarContent.unshift('partials/partial.project-editbox.ejs');
                }
                next();
            }
        });
    }
}

/**
 * Project edits page
 */
exports.projects.edit = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.pageTitle = ['partials/partial.project-title'];
        res.context.bodyClasses = ['sidebar-layout', 'project', 'project-edit', 'project-' + req.params.pid];
        res.context.sidebarContent = [
            'partials/partial.project-metrics-sidebar.ejs',
            'partials/partial.project-location-sidebar.ejs',
            'partials/partial.project-owner-sidebar.ejs'
        ];
        res.context.titleContent = [
            'partials/partial.project-subtitle.ejs',
            'partials/partial.project-progress.ejs'
        ];
        res.context.contentMain = ['pages/content.project-edit.ejs'];
        
        // Get project
        controllers.projects.get(req.params.pid, function(err, project) {
            if (err && !project) {
                console.error('ControllerError for project with id: ' + req.params.pid);
                console.error(err);
                next();
            }
            else {
                res.context = utils.combine(res.context, project);
                res.context.project._id = req.params.pid;
                res.context.project.supporters = project.supporters || []
                next();
            }
        });
    }
}

/**
 * Profile page
 */
exports.profileDetailsPage = function(uid, /* [getProjectController], */ callback) {
    var page = {}
      , options = [].slice.call(arguments, 1)
      , callback = options.pop()
      , getUserController = options.pop() || controllers.users.get
    
    getUserController(uid, function(err, userContext) {
        page = userContext;
        page.user._id = uid;
        
        // Views and context
        page.pageTitle = 'Profile for ' + page.user.username;
        page.bodyClasses = ['sidebar-layout', 'profile', 'profile-view', 'profile-' + uid];
        page.sidebarContent = [
            'partials/partial.general-location.ejs'
        ];
        page.contentMain = ['pages/content.profile.ejs'];
        callback(page);
    });
}

/**
 * User register form
 */
exports.userRegister = function(req, res, callback) {
    var context = {};
    
    // Views and context
    context.formBuilder = models.Users.formDescriber();
    context.pageTitle = 'Register';
    context.bodyClasses = ['user', 'user-register'];
    context.contentMain = ['partials/partial.form-builder.ejs'];
    
    callback(context)
}

/**
 * User register form
 */
exports.userLogin = function(req, res, callback) {
    var form_context = {};
    
    // Views and context
    form_context.pageTitle = 'Login';
    form_context.bodyClasses = ['user', 'user-login'];
    form_context.contentMain = ['pages/content.user-login.ejs'];
    
    callback(form_context)
}
