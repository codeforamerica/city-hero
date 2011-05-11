/**
 * @fileoverview Controllers for projects.
 */

models = require('./models');

var Projects = {
    
    /**
     * Retrieve a project.
     * @param {Request} The reqeust object.
     * @param {Response} The response object.
     * @param {Function} The callback.  Accepts a context object as a parameter.
     */
    retrieve : function(req, res, callback) {
        context = {};
        callback(context);
    },
    
    create_project : function(req, res, callback) {
        project = {
            title: req.body.project_title //,
            // ...
        }
        
        model.Projects.save(project, function(data) {
            callback(data)
        })
    }
};

exports.Projects = Projects;
