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

var Session = {
    get_context: function(req, res, app, callback) {
        var context = {}
          , facebook;
        
        facebook = new app.custom.fbsdk.Facebook({
            appId: app.custom.auth.fb.appId,
            secret: app.custom.auth.fb.secret,
            request: req,
            response: res
        });
        
        
        if (facebook.getSession()) {
console.log('You are logged into facebook!');
            facebook.api('/me', function(me) {
                fbid = me.id;
                
                context.user = true
                context.actionHref = facebook.getLogoutUrl();
                context.actionTitle = 'Log Out';
                if (callback) {
                    callback({session: context}); 
                } else {
                    return {session: context};
                }
            });
        } 
        else {
console.log('You are NOT logged into facebook!');
            //  If the user is not logged in, just show them the login button.
            context.user = false;
            context.actionHref = facebook.getLoginUrl();
            context.actionTitle = 'Login with Facebook';
            if (callback) {
                callback({session: context}); 
            } else {
                return {session: context};
            }
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
    
    get_all_projects: function(req, res, callback) {
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
exports.Session = Session;
exports.Projects = Projects;
