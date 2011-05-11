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
        this.db.save(project, function(err, resp) {
            callback(err, resp);
        });
    }
}

exports.Projects = Projects;
