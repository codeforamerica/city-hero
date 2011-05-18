/**
 * @fileoverview Controllers for projects.
 */

var controllers = require('./controllers');

exports.homePage = function(/* [getAllProjectsController, ] */ callback) {
    var options = [].slice.call(arguments)
      , callback = options.pop()
      , getAllProjectsController = options.shift() || controllers.projects.all;
    
    getAllProjectsController(function(err, projects_context) {
        var homepage_context = projects_context;
        
        homepage_context.pageTitle = 'Welcome to City Hero';
        homepage_context.bodyClasses = ['front', 'home'];
        homepage_context.sidebarInnerContent = ['partials/partial.sidebar-home.ejs'];
        homepage_context.contentMain = ['pages/content.home.ejs', 'partials/partial.project-slider.ejs'];
        
        callback(homepage_context);
    });
}

exports.projectForm = function(callback) {
    var form_context = {};
    
    // Views and context
    form_context.pageTitle = 'Add a Project';
    form_context.bodyClasses = ['project', 'project-add'];
    form_context.contentMain = ['pages/content.project-add.ejs'];
    
    callback(form_context)
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
        
        // Views and context
        page.pageTitle = project_context.project.title;
        page.bodyClasses = ['sidebar-layout', 'project', 'project-view', 'project-' + pid];
        page.sidebarContent = [
            'partials/partial.project-sidebar.ejs'
        ];
        page.titleContent = [
            'partials/partial.project-subtitle.ejs',
            'partials/partial.project-progress.ejs'
        ];
        page.contentMain = ['pages/content.project.ejs'];
    
        callback(page);
    });
}

/**
 * User register form
 */
exports.userRegister = function(req, res, callback) {
    var form_context = {};
    
    // Views and context
    form_context.pageTitle = 'Register';
    form_context.bodyClasses = ['user', 'user-register'];
    form_context.contentMain = ['pages/content.user-register.ejs'];
    
    callback(form_context)
}
