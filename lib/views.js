/**
 * @fileoverview Controllers for projects.
 */

var controllers = require('./controllers');

HomePage = {
    getView : function(req, res, callback) {
        controllers.Projects.get_all_projects(req, res, function(err, projects_context) {
            var homepage_context = projects_context;
            
            homepage_context.pageTitle = 'Welcome to City Hero';
            homepage_context.bodyClasses = ['front', 'home'];
            homepage_context.sidebarInnerContent = ['partials/partial.sidebar-home.ejs'];
            homepage_context.contentMain = ['pages/content.home.ejs', 'partials/partial.project-slider.ejs'];
            
            callback(homepage_context);
        });
    }
}

CreateProjectForm = {
    getView : function(req, res, callback) {
        var form_context = {};
        
        // Views and context
        form_context.pageTitle = 'Add a Project';
        form_context.bodyClasses = ['project', 'ptoject-add'];
        form_context.contentMain = ['pages/content.project-add.ejs'];
        
        callback(form_context)
    }
}

ProjectWizard = {
    getView : function(callback) {
        var wizard = {};
            
        // Views and context
        wizard.pageTitle = 'Start a Project';
        wizard.bodyClasses = ['project', 'ptoject-add'];
        wizard.contentMain = ['pages/content.project-wizard.ejs'];
        
        callback(wizard);
    }
};


exports.HomePage = HomePage;
exports.CreateProjectForm = CreateProjectForm;
exports.ProjectWizard = ProjectWizard;
