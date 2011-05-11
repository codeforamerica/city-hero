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
        if(req.form) {
            req.form.complete(function(err, fields, files){
                // TODO : validate this stuff!!
                project = {
                    title: fields['project-title'],
                    description: fields['project-description'],
                    location: fields['project-location'],
                    image: fields['project-image'],
                    video: fields['project-video'],
                    link: fields['project-link']
                }
                
                // If our images are not going into the couch - do some parallel
                models.Projects.save(project, function(err, resp) {
                    callback(err, resp);
                });
            });
        }
    }
};

exports.Projects = Projects;
