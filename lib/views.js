/**
 * @fileoverview Controllers for projects.
 */
var models = require('./models');
var controllers = require('./controllers');
var utils = require('./utils');

/**
 * Middleware to get page context.
 */
exports.middlePageContext = function () {
    return function (req, res, next) {
        req.context = req.context || {};
        req.app = req.app || {};

        if (req.app.route) {
            switch (req.app.route) {
                case '/':
                    // This could actually be put into middleware.
                    controllers.projects.all(function(err, projects) {
                        req.context = utils.combine(req.context, projects);
                        req.context.pageTitle = 'Welcome to City Hero';
                        req.context.bodyClasses = ['front', 'home'];
                        req.context.contentMain = ['pages/content.home.ejs', 'partials/partial.project-slider.ejs'];
                        next();
                    });
                    break;
                    
                default:
                    next();
                    break;
            }
        }
        else {
            next();
        }
    }
}


exports.homePage = function(/* [getAllProjectsController, ] */ callback) {
    var options = [].slice.call(arguments)
      , callback = options.pop()
      , getAllProjectsController = options.shift() || controllers.projects.all;
    
    getAllProjectsController(function(err, projects_context) {
        var homepage_context = projects_context;
        
        homepage_context.pageTitle = 'Welcome to City Hero';
        homepage_context.bodyClasses = ['front', 'home'];
        homepage_context.contentMain = ['pages/content.home.ejs', 'partials/partial.project-slider.ejs'];
        
        callback(homepage_context);
    });
}

exports.projectForm = function(req, res, callback) {
    var form_context = {};
    
    // Views and context
    form_context.pageTitle = 'Add a Project';
    form_context.bodyClasses = ['project', 'project-add'];
    form_context.contentMain = ['pages/content.project-add.ejs'];

    callback(form_context);
}

exports.projectWizard = function(callback) {
    var wizard = {};
        
    // Views and context
    wizard.pageTitle = 'Start a Project';
    wizard.bodyClasses = ['project', 'project-add'];
    wizard.bodyClasses = ['project', 'project-wizard'];
    wizard.contentMain = ['pages/content.project-wizard.ejs'];
    
    callback(wizard);
}

exports.projectDetailsPage = function(pid, /* [getProjectController], */ callback) {
    var page = {}
      , options = [].slice.call(arguments, 1)
      , callback = options.pop()
      , getProjectController = options.pop() || controllers.projects.get

    getProjectController(pid, function(err, project_context) {
        
        page = project_context;
        page.project._id = pid;
        page.project.supporters = page.project.supporters || []
        
        // Views and context
        page.pageTitle = project_context.project.title;
        page.bodyClasses = ['sidebar-layout', 'project', 'project-view', 'project-' + pid];
        page.sidebarContent = [
            'partials/partial.project-metrics-sidebar.ejs',
            'partials/partial.project-location-sidebar.ejs',
            'partials/partial.project-owner-sidebar.ejs'
        ];
        page.titleContent = [
            'partials/partial.project-subtitle.ejs',
            'partials/partial.project-progress.ejs'
        ];
        page.contentMain = ['pages/content.project.ejs'];
    
        callback(page);
    });
}

exports.projectDetailsEditPage = function(pid, /* [getProjectController], */ callback) {
    var page = {}
      , options = [].slice.call(arguments, 1)
      , callback = options.pop()
      , getProjectController = options.pop() || controllers.projects.get

    getProjectController(pid, function(err, project_context) {
        
        page = project_context;
        page.project._id = pid;
        
        // Views and context
        page.pageTitle = ['partials/partial.project-title'];
        page.bodyClasses = ['sidebar-layout', 'project', 'project-edit', 'project-' + pid];
        page.sidebarContent = [
            'partials/partial.project-sidebar.ejs'
        ];
        page.titleContent = [
            'partials/partial.project-subtitle.ejs',
            'partials/partial.project-progress.ejs'
        ];
        page.contentMain = ['pages/content.project-edit.ejs'];

        callback(page);
    });
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
