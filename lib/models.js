/**
 * @fileoverview Models for projects.
 */

var fs = require('fs')

/**
 * Projects model.
 */
exports.Projects = {
    
    init: function(conn, dbname) {
        this.db = conn.database(dbname);
    },
    
    all: function(callback) {
        this.db.all({ 'include_docs':'true' }, function(err, docs) {
            //console.log(docs);
            callback(err, docs);
        });
    },
    
    get: function(pid, callback) {
        this.db.get(pid, function (err, doc) {
            console.log(doc);
            callback(err, doc);
        });
    },
    
    save: function(project, callback) {
        var project_data = {}
          , attachments = []
          , that = this;
        
        // Separate out the data that we have to handle in a special way.  Put
        // the rest into the project_data object.
//console.log(project);
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
                console.log('Uploading attachment')
                console.log(attachment)
                fs.readFile(attachment.path, function(err, att_data) {
                    if (err) { console.log(err); }
                    
                    that.db.saveAttachment(id, att_key, attachment.type, 
                                           att_data, function(att_resp) {
                        console.log(att_resp);
                        
                        // NOTE: This shouldn't be called from here if we're
                        //       uploading multiple attachments.  But how do
                        //       we tell that all the attachments have been
                        //       uploaded?
                        callback(err, resp);
                    });
                });
            }
            
            if (attachments.length === 0) {
                callback(err, resp);
            }
        });
    }
}

/**
 * Users
 */
exports.Users = {
    
    init: function(conn, dbname) {
        // TODO: Make database if not exists.
        this.db = conn.database(dbname);
    },
    
    all: function(callback) {
        this.db.all({ 'include_docs': 'true' }, function(err, docs) {
            callback(err, docs);
        });
    },
    
    get: function(uid, callback) {
        this.db.get(uid, function (err, doc) {
            callback(err, doc);
        });
    },
    
    save: function(user, callback) {
        var userData = {}
          , attachments = []
          , that = this;
        
        // Separate out the data that we have to handle in a special way.  Put
        // the rest into the project_data object.
        for (key in user) {
            if (key === '_attachments') {
                attachments = user[key]
            }
            else {
                userData[key] = user[key]
            }
        }
        
        // Save the project data to the database.
        this.db.save(userData, function(err, resp) {
            var id = resp._id
              , att_key
              , attachment;
            
            for (att_key in attachments) {
                attachment = attachments[att_key]
                console.log('Uploading attachment')
                console.log(attachment)
                fs.readFile(attachment.path, function(err, att_data) {
                    if (err) { console.log(err); }
                    
                    that.db.saveAttachment(id, att_key, attachment.type, 
                                           att_data, function(att_resp) {
                        console.log(att_resp);
                        
                        // NOTE: This shouldn't be called from here if we're
                        //       uploading multiple attachments.  But how do
                        //       we tell that all the attachments have been
                        //       uploaded?
                        callback(err, resp);
                    });
                });
            }
            
            if (attachments.length === 0) {
                callback(err, resp);
            }
        });
    }
}