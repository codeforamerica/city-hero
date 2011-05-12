/**
 * @fileoverview Controllers for projects.
 */

var models = require('./models');
var auth = require('./settings/auth.js');
var settings = require('./settings/settings.js');

/* NOTE: If there were a thing that auto-generated express projects, it would
 *       autogenerate the Site and Auth controllers as well.
 */
var Site = {
    get_context: function(req, res, callback) {
        var context = {sitePort: settings.sitePort
                     , siteName: settings.siteName};
        
        if (callback) {
            callback(context);
        } else {
            return context;
        }
    }
}

var Auth = {
    get_context: function(req, res, callback) {
        var context = {dbHost: auth.db.host
                     , dbPort: auth.db.port};
        
        if (callback) {
            callback(context);
        } else {
            return context;
        }
    }
}

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
                    link: fields['project-link'],
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

exports.Site = Site;
exports.Auth = Auth;
exports.Projects = Projects;