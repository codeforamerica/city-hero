/**
 * @fileoverview Models for projects.
 */

cradle = require('cradle');

var Projects = {
    
    init: function(conn, settings) {
        this.db = conn.database(dbname);
    },
    
    get: function(pid, callback) {
        this. db.get(pid, function (err, doc) {
            callback(err, doc);
        });
    },
    save: function(project, callback) {
        
    }
}

exports.Projects = Projects;
