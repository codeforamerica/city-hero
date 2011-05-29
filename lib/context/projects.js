/**
 * @fileoverview Views for projects.  Overall, we are setting
 * res.context which will be passed to template file.
 */
var utils = require('utils');
var controllers = require('controllers');

/**
 * Project wizad page.
 */
exports.wizard = function() {
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
exports.details = function() {
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
exports.edit = function() {
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