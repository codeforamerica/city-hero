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

ProjectWizard = {
    getView : function() {
    }
};


exports.HomePage = HomePage;
