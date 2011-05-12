/**
 * @fileoverview Models for projects.
 */

var fs = require('fs')

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
        
        // Separate out the data that we have to handle in a special way.  Put
        // the rest into the project_data object.
        for (key in project) {
            if (key === '_attachments') {
                attachments = project[key]
            }
            else {
                project_data[key] = project[key]
            }
        }
        
        // Save the project data to the database.
        this.db.save(project_data, function(err, resp) {
            var id = resp._id
              , att_key
              , attachment;
            
            for (att_key in attachments) {
                attachment = attachments[att_key]
                fs.readFile(attachment.path, function(att_data) {
                    that.db.saveAttachment(id, att_key, attachment.type, 
                                           att_data, function(att_resp) {
                        console.log(att_resp);
                    });
                });
            }
            
            // How do we tell that all the attachments have been uploaded?  Does
            // it matter?
            callback(err, resp);
        });
    }
}

exports.Projects = Projects;
