var session = require('./session');
var utils = require('utils');
var models = require('models');

/**
 * Users controller
 */
exports.get = function(uid, callback) {
    models.users.get(uid, function(err, user) {
        if (err) {
            console.error(err)
            callback(err, null);
        }
        
        var context = {user: user};
        callback(err, context);
    });
};

exports.all = function(callback) {
    models.users.all(function(err, docs) {
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
};

exports.createUser = function(req, res, callback) {
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
        models.users.save(user, function(err, resp) {
            callback(err, resp);
        });
    }
    else {
        callback({}, {});
    }
};

/**
 * Checks for existing username.  Express middleware format.
 */
exports.checkUsername = function() {
    return function (req, res, next) {
        var submittedUsername = req.params.username || false;
        
        // Get all, it would make more sense to create a view for this.
        models.users.all(function(err, users) {
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
};

/**
 * Validation set of middleware for registration page,
 * returning an array of functions for express/connect
 * to deal with.
 */
exports.validateRegistration = function() {
    var eForm = require('express-form');
    var filter = eForm.filter;
    var validate = eForm.validate;
    
    return [
        eForm(
            validate('username', 'User name').required().isAlphanumeric(),
            validate('email', 'Email').required().isEmail(),
            validate('password', 'Password').required().isAlphanumeric(),
            validate('password_confirm', 'Password Confirmation').required().equals('field::password'),
            validate('email_confirm', 'Email Confirmation').required().equals('field::email')
        ),
        exports.checkUsername()
    ];
};

/**
 * Check role middleware.  Takes roles and determines
 * if the current user has access.
 */
exports.hasAccess = function(roles) {
    return function (req, res, next) {
        var allowed = false;

        // Check if user has specific roles
        if (roles.constructor == Array && req.session.user) {
            for (var i = 0; i < roles.length; i++) {
                if (req.session.user.role == roles[i]) {
                    allowed = true;
                }
                
                // Hard code authenticated
                if (roles[i] == 'authenticated') {
                    allowed = true;
                }
            }
        }
        
        // Check the results
        if (allowed) {
            next();
        }
        else {
            req.session.nextUrl = req.url;
            session.setMessage(req, res, 'You do not have access to view that page.');
            res.redirect('/user/login');
        }
    }
};

/**
 * Check ensure that user is NOT logged in middleware.
 */
exports.notLoggedIn = function(roles) {
    return function (req, res, next) {
        var allowed = false;

        // Check if user is logged in, via session variables
        if (!req.session.userLoggedIn) {
            allowed = true;
        }
        
        // Check the results
        if (allowed) {
            next();
        }
        else {
            session.setMessage(req, res, 'You do not have access to view that page.');
            res.redirect('/');
        }
    }
};

/**
 * Check steps
 */
exports.findWay = function(id, next) {
    models.users.get(id, function(err, user) {
        if (err) {
            console.error(err)
            next(err, null);
        }
        
        // Get steps
        steps = models.users.steps();
        
        // A user cannot view these steps without registering
        steps[0].completed = true;
        
        // Check other steps
        if (user._attachments && user._attachments['profile_image']) {
            steps[1].completed = true;
        }
        // Check is user has bio
        if (user.profile_bio) {
            steps[2].completed = true;
        }
        // Check if user has location
        if (user.profile_location) {
            steps[3].completed = true;
        }
        // Check is user has motto
        if (user.profile_motto) {
            steps[4].completed = true;
        }
        
        next(err, steps);
    });
};

/**
 * Validate profile
 */
exports.validateProfile = function() {
    var eForm = require('express-form');
    var filter = eForm.filter;
    var validate = eForm.validate;
    var validationCollection = [];
    
    return validationCollection;
    /*
    return [
        eForm(
            validate('username', 'User name').required().isAlphanumeric(),
            validate('email', 'Email').required().isEmail(),
            validate('password', 'Password').required().isAlphanumeric(),
            validate('password_confirm', 'Password Confirmation').required().equals('field::password'),
            validate('email_confirm', 'Email Confirmation').required().equals('field::email')
        ),
    ];
    */
}

/**
 * Save profile
 */
exports.saveProfile = function() {
    return function(req, res, next) {
        res.context = res.context || {};
        if ((typeof req.form.isValid != 'undefined') && req.form.isValid === false) {
            for (var n in req.form.errors) {
                session.setMessage(req, res, req.form.errors[n]);
            }
            res.redirect('/profile/edit/' + req.params.uid);
        }
        else {
            var fullUser = utils.combine(req.session.user, req.params);

            // There should be a fitler function, but we'll do this
            // here
            if (fullUser['project-lon']) {
                fullUser.geometry = {
                    'type': 'Point',
                    'coordinates': [
                        fullUser['project-lon'],
                        fullUser['project-lat']
                    ]
                };
            }

            models.users.merge(fullUser, function(err, context) {
                session.setMessage(req, res, 'Profile saved.');
                
                var redirect = (context.username) ? '/profile/' + context.username : '/';
                res.redirect(redirect);
                next();
            });
        }
    
    }
}
