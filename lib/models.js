/**
 * @fileoverview Models for projects.
 */
var utils = require('./utils');
var fs = require('fs')

/**
 * Projects model.
 */
exports.Projects = {
    
    init: function(conn, dbname) {
        var that = this;
        this.db = conn.database(dbname);
        this.db.exists(function(err, exists) {
            if(!exists) { that.db.create(); }
        });
    },
    
    all: function(callback) {
        this.db.all({ 'include_docs':'true' }, function(err, docs) {
            callback(err, docs);
        });
    },
    
    get: function(pid, callback) {
        // HACK!!!! Sweet Christ on a crutch, figure this out.  
        // We should probably not rely on the length of a string...
        if(pid.length === 32) {
            this.db.get(pid, function (err, doc) {
                if (err) {
                    console.error('ModelError while getting project: ' + pid);
                    console.error(err);
                }
                callback(err, doc);
            });
        } else {
            this.db.view('projectviews/byslug', function(err, projects) {
                if (err) {
                    console.error('ModelError while getting project: ' + pid);
                    console.error(err);
                    callback(err, projects)
                } else {
                    projects.forEach(function (proj) {
                        if(proj.slug == pid) {
                            callback(err, proj);
                        }
                    });
                }
            });
        }
    },
    
    tasks: function (project) {
        return [
            {
                'name': 'Add an Image',
                'description': 'Upload a picture or video for your project page',
                'fullText': 'This would be the full text for a popup sort of thing',
                'points': 10,
                'form': {
                    'project-image': {
                        'type': 'file',
                        'label': 'Upload an image',
                        'help': 'To upload an image...'
                    }
                }
            }
        ]
    },
    
    save: function(project, callback) {
        
        var project_data = {}
          , attachments = []
          , that = this;
        
        // Separate out the data that we have to handle in a special way.  Put
        // the rest into the project_data object.
        for (key in project) {
            if (key === '_attachments') {
                attachments = project[key];
            }
            else {
                project_data[key] = project[key]
            }
        }
        
        // See if slug exists
        this.db.view('projectviews/byslug', function(err, projects) {
            if (err) {
                console.error('ModelError while looking up slug: ' + slug);
                console.error(err);
                callback(err, null);
            } 
            
            var numLoops = 0;
            var slugUnique = false;
            var foundMatch = false;
            var trialSlug = project_data.slug || utils.slugify(project_data.title);
            
            // This code attempt to create a unique slug
            do {
                numLoops++;
                projects.forEach(function (proj) {
                    if(proj.slug === trialSlug && proj._id != project_data._id) { foundMatch = true; }
                });
                if(!foundMatch) {
                    slugUnique = true;
                    project_data.slug = trialSlug;
                } else {
                    trialSlug = project_data.slug + '-' + numLoops;
                    foundMatch = false;
                }
            } while(!slugUnique);
            
            /**
             * Function for saving attachments that came with a project.  Used
             * in both creating and updating project.
             */
            function save_attachments(resp) {
                var id = resp._id
                  , att_key
                  , attachment
                  , num_atts = 0;
                
                for (att_key in attachments) {
                    ++num_atts;
                
                    attachment = attachments[att_key]
                    fs.readFile(attachment.path, function(err, att_data) {
                        if (err) {
                            console.error(err);
                            --num_atts;
                            callbackIfAllDone(err, null);
                        } else {
                            that.db.saveAttachment(id, att_key, attachment.type,
                                                   att_data, function(att_resp) {
                        
                                // NOTE: This shouldn't be called from here if we're
                                //       uploading multiple attachments.  But how do
                                //       we tell that all the attachments have been
                                //       uploaded?
                                --num_atts;
                                callbackIfAllDone(err);
                            });
                        }
                    });
                }
            
                /**
                 * Helper function that will run the actual callback only after 
                 * the attachments have been processed.
                 */
                function callbackIfAllDone(cberr) {
                    // Compile all the errors received into a list
                    if (cberr) {
                        err = (err) ? err + ', ' + cberr : cberr;
                    }
                
                    // When there are no more attributes, callback for real
                    if (num_atts === 0) {
                        callback('[' + err + ']', resp);
                    }
                }
            
                callbackIfAllDone(err);
            }
            
            if(project_data._id) {
                that.db.merge(project_data, function(err, resp) {
                    save_attachments(resp);
                });
            } else {
        
                // Save the project data to the database.
                that.db.save(project_data, function(err, resp) {
                    save_attachments(resp);
                });
            }
        });
    }
}

/**
 * Users
 */
exports.Users = {
    currentObject: {},
    
    /**
     * Initialize model with database connection.
     */
    init: function(conn, dbname) {
        var that = this;
        this.db = conn.database(dbname);
        this.db.exists(function(err, exists) {
            if(!exists) { that.db.create(); }
        });
    },
    
    all: function(callback) {
        this.db.all({ 'include_docs': 'true' }, function(err, docs) {
            callback(err, docs);
        });
    },
    
    get: function(uid, callback) {
        var that = this;

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
    },
    
    save: function(user, callback) {
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
                        //       uploaded?
                        console.log('hollaback #1');
                        callback(err, resp);
                    });
                });
            }

            if(!hasAttachments) {
                console.log('hollaback #2');
                callback(err, resp);
            }
        };
        
        // Check if its an update
        if (userData._id && userData._rev) {
            this.db.save(userData._id, userData._rev, userData, saveHandler);
        }
        else {
            this.db.save(userData, saveHandler);
        }
    },
    
    /**
     * Merge is using an existing user
     */
    merge: function(user, callback) {
        var self = this;
    
        // Get user
        self.get(user._id, function(err, existing) {
console.log('existing user: ');
console.log(existing);
            var mergedUser = utils.combine(user, existing);
console.log('merged user: ');
console.log(mergedUser);
            self.save(mergedUser, function(err, response) {
console.error(err);
console.log(response);
                callback(err, response);
            });
        });
    },
    
    /**
     * Form description object
     */
    formDescriber: function() {
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
    },
    
    /**
     * Steps data.  This is text and form descriptions.
     *
     * Points are used because percentage would mean we
     * would have to ensure it added up to 100.
     *
     * Note that the register function is already made.
     */
    steps: function() {
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
    }
}
