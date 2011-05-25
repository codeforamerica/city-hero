var models = require('../models');

/**
 * Projects controller
 */
exports.projects = {
    
    /**
     * Retrieve a project.
     * @param {Request} The reqeust object.
     * @param {Response} The response object.
     * @param {Function} The callback.  Accepts a context object as a parameter.
     */
    get: function(pid, callback) {
        models.Projects.get(pid, function(err, project) {
            if (err) {
                console.error(err);
                callback(err, null);
            }
            if(project.creator && project.creator !== "undefined") {
                models.Users.get(project.creator, function(err, user) {
                    if(err) {
                        console.error(err);
                        callback(err, null);
                    }
                    project.owner = user;
                    var context = {project: project};
                    callback(err, context);
                    
                });
            } else {
                var context = {project: project};
                callback(err, context);
            }
        })
    },
    
    all: function(callback) {
        models.Projects.all(function(err, docs) {
            var project
              , projects = [];
            
            if (err) {
                console.error(err);
                callback(err, null);
            }
            
            for (project_key in docs) {
                project = docs[project_key].doc;
                projects.push(project);
            }
            callback(err, {projects: projects});
        });
    },
    
    create_project: function(req, res, callback) {
        if(req.form) {
            req.form.complete(function(err, fields, files){
                // TODO : validate this stuff!!
                project = {
                    title: fields['project-title'],
                    description: fields['project-description'] || fields['project-mission'],
                    location: fields['project-location'],
                    creator: fields['project-creator'],
                    geometry: {
                        "type": "Point",
                        "coordinates": [
                            fields['project-lon'],
                            fields['project-lat']
                        ]
                    },
                    link: fields['project-link'],
                    _attachments: files                    
                }
                
                // If our images are not going into the couch - do some parallel
                models.Projects.save(project, function(err, resp) {
                    callback(err, resp);
                });
            });
        }
    },
    
    updateProject: function(req, res, callback) {
        if(req.form) {
            req.form.complete(function(err, fields, files){
                // TODO : validate this stuff!!
                project = {
                    _id: fields._id,
                    title: fields.title,
                    description: fields.description,
                    _attachments: files                    
                }
                
                console.log(files);
                
                // If our images are not going into the couch - do some parallel
                models.Projects.save(project, function(err, resp) {
                    callback(err, resp);
                });
            });
        }
    }
};