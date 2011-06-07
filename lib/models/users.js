/**
 * @fileoverview Models for projects.
 */
var utils = require('utils');
var fs = require('fs');

/**
 * Users
 */
exports.currentObject = {};
    
/**
 * Initialize model with database connection.
 */
exports.init = function(conn, dbname) {
    var that = this;
    this.db = conn.database(dbname);
    this.db.exists(function(err, exists) {
        if(!exists) { that.db.create(); }
    });
};

exports.all = function(callback) {
    this.db.all({ 'include_docs': 'true' }, function(err, docs) {
        callback(err, docs);
    });
};

exports.get = function(uid, callback) {
    var that = this;

    // Test if we are sent a list of ids
    if(typeof uid === 'object') {
        this.db.get(uid, function (err, doc) {
            callback(err, doc);
        });
    }

    // HACK!!!! Sweet Christ on a crutch, figure this out.  
    // We should probably not rely on the length of a string...
    if(uid.length === 32) {
        this.db.get(uid, function (err, doc) {
            that.currentObject = doc;
            callback(err, doc);
        });
    } else {
        this.db.view('userviews/usernames', function(err, users) {            
            users.forEach(function (user) {
                if(user.username == uid) {
                    that.currentObject = user;
                    callback(err, user);
                }
            });
        });            
    }
};

exports.save = function(user, callback) {
    var userData = {}, attachments = [], that = this;
    
    // Separate out the data that we have to handle in a special way.  Put
    // the rest into the userData object.
    for (key in user) {
        if (key === '_attachments') {
            attachments = user[key]
        }
        else {
            userData[key] = user[key]
        }
    }
    
    // Create save handler
    var saveHandler = function(err, resp) {
        var id = resp._id, att_key, attachment, hasAttachments = false;

        // Create a more meaningful resp
        resp = utils.combine(resp, userData);

        // Go through attachments
        for (att_key in attachments) {
            hasAttachments = true;
            attachment = attachments[att_key];

            fs.readFile(attachment.path, function(err, att_data) {
                if (err) { console.error(err); }
        
                that.db.saveAttachment(id, att_key, attachment.type, att_data, function(att_resp) {
                    // NOTE: This shouldn't be called from here if we're
                    //       uploading multiple attachments.  But how do
                    //       we tell that all the attachments have been
                    //       uploaded?  <- Look how its done in the Project model
                    callback(err, resp);
                });
            });
        }

        if(!hasAttachments) {
            callback(err, resp);
        }
    };
    
    // Check if its an update
    if (userData._id && userData._rev) {
        this.db.merge(userData, saveHandler);
    }
    else {
        this.db.save(userData, saveHandler);
    }
};

/**
 * Merge is using an existing user
 */
exports.merge = function(user, callback) {
    var self = this;

    // Get user
    self.get(user._id, function(err, existing) {
        var mergedUser = utils.combine(existing, user);
        self.save(mergedUser, function(err, response) {
            callback(err, response);
        });
    });
};

/**
 * Form description object
 */
exports.formDescriber = function() {
    return {
        'username': {
            'type': 'textfield',
            'label': 'Username',
            'help': 'Enter a username that is only characters (a-Z) and numbers.',
            'size': '50',
            'required': true,
            'validation': {
                'alphanumeric': true,
                'custom': this.validatorUserExists
            }
        },
        'password': {
            'type': 'password',
            'label': 'Password',
            'help': 'Enter a password ...',
            'size': '50',
            'required': true
        },
        'password_confirm': {
            'type': 'password',
            'label': 'Password Confirmation',
            'help': 'Re-enter a password ...',
            'size': '50',
            'wrapperClasses': [
                'confirm-field'
            ],
            'required': true
        },
        'email': {
            'type': 'textfield',
            'label': 'Email',
            'help': 'Enter your email address.',
            'size': '50',
            'required': true
        },
        'email_confirm': {
            'type': 'textfield',
            'label': 'Email Confirmation',
            'help': 'Re-Enter your email address.',
            'size': '50',
            'required': true
        },
        'submit': {
            'type': 'submit',
            'value': 'Submit'
        }
    };
};

/**
 * Steps data.  This is text and form descriptions.
 *
 * Points are used because percentage would mean we
 * would have to ensure it added up to 100.
 *
 * Note that the register function is already made.
 */
exports.steps = function() {
    var steps = [];
    steps[0] = {
        'name': 'Register',
        'description': 'Create a user on the site.',
        'fullText': 'This would be the full text for a popup sort of thing',
        'points': 20,
        'form': this.formDescriber()
    };
    steps[1] = {
        'name': 'Add a picture',
        'description': 'If you had a picture of yourself, blah, blah...',
        'fullText': 'This would be the full text for a popup sort of thing',
        'points': 10,
        'form': {
            'profile_image': {
                'type': 'file',
                'help': 'To upload an image...'
            }
        }
    };
    steps[2] = {
        'name': 'Tell us about you',
        'description': 'Add a description of yourself',
        'fullText': 'Something about a how to write a description about you',
        'points': 20,
        'form': {
            'profile_bio': {
                'type': 'textarea',
                'help': 'Some great help text for bios',
                'rows': 5
            }
        }
    };
    steps[3] = {
        'name': 'Where',
        'description': 'Tell us where you are',
        'fullText': 'By providing a location (as specific as you want) we can help provide more specific ontent to you, and it will be easier to find people close to you.',
        'points': 10,
        'form': {
            'profile_location': {
                'type': 'textfield',
                'label': 'Location',
                'help': 'Some great help text location',
                'geocode': true
            }
        }
    };
    steps[4] = {
        'name': 'Do you have a motto?',
        'description': 'Add a motto',
        'fullText': 'Something about a motto',
        'points': 5,
        'form': {
            'profile_motto': {
                'type': 'textfield',
                'help': 'Some great help text for mottos'
            }
        }
    };
    
    return steps;
};