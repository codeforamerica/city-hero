var models = require('../models');

/**
 * Users controller
 */
exports.user = {
    
    get: function(uid, callback) {
        models.Users.get(uid, function(err, user) {
            if (err) {
                console.error(err)
                callback(err, null);
            }
            
            var context = {user: user};
            callback(err, context);
        })
    },
    
    all: function(callback) {
        models.Users.all(function(err, docs) {
            var users = [];
            
            if (err) {
                console.error(err);
                callback(err, null);
            }
            
            for (userID in docs) {
                users.push(docs[userID].doc);
            }
            callback(err, {users: users});
        });
    },
    
    createUser: function() {
        return function (req, res, next) {
            var user = (req.params) ? req.params : {};
            
            if (user.username && user.password) {
                // Hash the password
                user.password = require('crypto').createHash('md5').update(user.password).digest("hex");
    
                // Handle attachments
                user._attachments = req.params.files;
    
                // Remove unnecessary values
                delete user.password_confirm;
                delete user.email_confirm;
                delete user.submit;
                
                // Save user
                models.Users.save(user, function(err, resp) {
                    next();
                });
            }
            else {
                next();
            }
        }
    },
    
    /**
     * Checks for existing username.  Express middleware format.
     */
    checkUsername: function() {
        return function (req, res, next) {
            var submittedUsername = req.params.username || false;
            
            // Get all, it would make more sense to create a view for this.
            models.Users.all(function(err, users) {
                var found = false;
                for (var u in users) {
                    if (users[u].doc.username == submittedUsername) {
                        found = true;
                    }
                }
                
                // If found, make form as invalid and write message.
                if (found) {
                    req.from = req.from || {};
                    req.from.isValid = false;
                    req.form.errors = req.form.errors || [];
                    req.form.errors.push('Username already exists.  Please choose a new one.');
                }
                
                next();
            });
        }
    }
};