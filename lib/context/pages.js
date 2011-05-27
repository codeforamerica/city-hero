/**
 * @fileoverview Views for projects.  Overall, we are setting
 * res.context which will be passed to template file.
 */
var utils = require('utils');

/**
 * Home page
 */
exports.home = function() {
    return function (req, res, next) {
        var controllers = require('controllers');
        
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