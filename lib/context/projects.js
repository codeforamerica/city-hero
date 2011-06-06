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

exports.nno_wizard = function() {
    return function (req, res, next) {
        res.context = res.context || {};
        res.context.pageTitle = 'Start Planning a National Night Out';
        res.context.bodyClasses = ['project', 'project-wizard'];
        res.context.contentMain = ['pages/content.nno-project-wizard.ejs'];
        next();
    }
}

/**
 * Project instance context.
 *
 * NOTE: Both the details and edit pages basically have the same code as is in 
 *       this method.  Should be refactored so that the controllers are chained
 *       like:
 *       
 *         [controllers.projects.instance(), controllers.projects.detail()]
 *         [controllers.projects.instance(), controllers.projects.edit()]
 */
exports.instance = function (notAuthMsg) {
    return function (req, res, next) {
        res.context = res.context || {};
        
        controllers.projects.get(req.params.pid, function(err, project) {
            if (err && !project) {
                console.error('ControllerError for project with id: ' + req.params.pid);
                console.error(err);
            }
            else {
                res.context.notAuthMsg = notAuthMsg;
                res.context = utils.combine(res.context, project);
                res.context.pageTitle = project.project.title;
                res.context.project._id = project.project._id;
                res.context.project.supporters = project.project.supporters || []
            }
            next();
        });
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
            'partials/partial.project-subtitle.ejs'
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
                res.context.project._id = project.project._id;
                res.context.project.supporters = project.project.supporters || []
        
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

exports.metrics = function() {
    return function (req, res, next) {
        var project = res.context.project;
        res.context.metrics = res.context.metrics || {};
        
        if (project.deadline) {
            // Convert deadline date from date string.
            var dateString = project.deadline; // Assumed to be an ISO 8601 date
            var year = dateString.substr(0,4);
            var month = dateString.substr(5,2);
            var day = dateString.substr(7,2);
            var deadline = new Date(year, month, day);
            
            // Calclate difference days until.
            var now = new Date();
            var day = 1000*60*60*24;
            var diff = Math.ceil((deadline.getTime()-now.getTime())/(day));
            
            res.context.metrics.daysLeft = diff;
        }
        
        next();
    }
};

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
            'partials/partial.project-wayfinder-sidebar.ejs',
            'partials/partial.project-location-sidebar.ejs',
            'partials/partial.project-owner-sidebar.ejs'
        ];
        res.context.titleContent = [
            'partials/partial.project-subtitle.ejs'
        ];
        res.context.contentMain = ['pages/content.project-edit.ejs'];
        res.context.scripts = res.context.scripts || [];
        res.context.scripts.push('/js/wayfinder.js');
        
        res.context.editable = {
            id: 'project-form',
            action: ''
        }
       
        // Get project
        controllers.projects.get(req.params.pid, function(err, project) {
            if (err && !project) {
                console.error('ControllerError for project with id: ' + req.params.pid);
                console.error(err);
                next();
            }
            else {
                res.context = utils.combine(res.context, project);
                res.context.project._id = project.project._id;
                res.context.project.supporters = project.project.supporters || []
                next();
            }
        });
    }
};
