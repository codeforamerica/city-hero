var session = require('./session');
var models = require('models');
var auth = require('settings/auth.js');
var settings = require('settings/settings.js');
var https = require('https');
var utils = require('utils');

/**
 * Projects controller
 */

/**
 * Retrieve a project.
 * @param {Request} The reqeust object.
 * @param {Response} The response object.
 * @param {Function} The callback.  Accepts a context object as a parameter.
 */
exports.get = function(pid, callback) {
    models.Projects.get(pid, function(err, project) {
        if (err) {
            console.error(err);
            callback(err, null);
        } else {
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
        }
    })
}

exports.all = function(callback) {
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
}

exports.create_project = function(req, res, callback) {
    if(req.form) {
        req.form.complete(function(err, fields, files){
            // TODO : validate this stuff!!
            project = {
                title: fields['project-title'],
                slug: utils.slugify(fields['project-title']),
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
            
//console.log(files);
            
            // If our images are not going into the couch - do some parallel
console.log('before the save' + fields)
            models.Projects.save(project, function(err, resp) {
console.log('during the save' + resp)
                callback(err, resp);
console.log('after the save')
            });
        });
    }
}

exports.updateProject = function(req, res, callback) {
    if(req.form) {
        req.form.complete(function(err, fields, files){
            var project;
            
            // TODO : validate this stuff!!
            if (fields.action && fields.action === 'setowner') {
                // TODO: need to check whether there's an owner already, 
                //       and put a message in the queue that you can't own
                //       a project that's already owned: "This project 
                //       already has an owner."
                project = {
                    _id: fields._id,
                    creator: fields.owner
                }
            } else {
                project = {
                    _id: fields._id,
                    title: fields.title,
                    description: fields.description,
                    _attachments: files                    
                }
            }
            
            // If our images are not going into the couch - do some parallel
            models.Projects.save(project, function(err, resp) {
                callback(err, resp);
            });
        });
    }
}

/**
 * Middle ware for checking if use can edit own project
 */
exports.editOwn = function() {
    return function(req, res, next) {
        var allowed = false;

        // The project should already be attached to the context
        if (res.context.project && res.context.project.owner._id == req.session.user._id) {
            allowed = true;
        }
        
        if (allowed) {
            next();    
        }
        else {
            exports.session.setMessage(req, res, 'You can only edit project you own.');
            res.redirect('/');
        }
    }
}

