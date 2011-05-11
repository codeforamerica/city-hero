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
    get_project: function(req, res, callback) {
        pid = req.params.pid;
        models.Projects.get(pid, function(err, project) {
            if (err) {
                console.error(err)
                callback(err, null);
            }
            
            var context = {project: project};
            callback(err, context);
        })
    },
    
    create_project: function(req, res, callback) {
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
