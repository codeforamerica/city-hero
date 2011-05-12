/**
 * @fileoverview Models for projects.
 */

cradle = require('cradle');

var Projects = {
    
    init: function(conn, dbname) {
        this.db = conn.database(dbname);
    },
    
    get: function(pid, callback) {
        this.db.get(pid, function (err, doc) {
            callback(err, doc);
        });
    },
    save: function(project, callback) {
        var project_data = {}
          , attachemnts = []
          , that = this;
        
        for (key in project) {
            if (key === '_attachments') {
                attachments = project[key]
            }
            else {
                project_data[key] = project[key]
            }
        }
                
        this.db.save(project_data, function(err, resp) {
            var id = resp._id
              , att_key;
            
            for (att_key in attachments) {
                that.db.saveAttachment(id, att_key, attachments[att_key].type, [], function(att_resp) {
                    console.log(att_resp);
                });
            }
            
            // How do we tell that all the attachments have been uploaded?  Does
            // it matter?
            callback(err, resp);
        });
    }
}

exports.Projects = Projects;
