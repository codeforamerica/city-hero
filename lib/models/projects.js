/**
 * @fileoverview Models for projects.
 */
var utils = require('utils');
var fs = require('fs');

/**
 * Projects model.
 */
exports.init = function(conn, dbname) {
    var that = this;
    this.db = conn.database(dbname);
    this.dbname = dbname;
    
    // Check if DB exists, if not, create;
    this.db.exists(function(err, exists) {
        if(!exists) { that.db.create(); }
        
        // Create views (maybe this reindexes thing? could be bad?)
        exports.createViews();
    });
};

/**
 * Create views
 */
exports.createViews = function(callback) {
    this.db.save('_design/projectviews', {
        bycreator: {
            map: function (doc) {
                if (typeof doc.creator != 'undefined') { emit(doc.creator, doc); }
            }
        },
        bysupporters: {
            map: function (doc) {
                if (typeof doc.supporters == 'object') {
                    for (var i in doc.supporters) {
                        emit(doc.supporters[i], doc); 
                    }
                }
            }
        },
        byslug: {
            map: function(doc) {
                if (doc.slug) { emit(doc.slug, doc); }
            }
        }
    });
};
    
exports.all = function(callback) {
    this.db.all({ 'include_docs':'true' }, function(err, docs) {
        callback(err, docs);
    });
};
    
exports.get = function(pid, callback) {
    // HACK!!!! Sweet Christ on a crutch, figure this out.  
    // We should probably not rely on the length of a string...
    if(pid.length === 32 && pid.indexOf('-') === -1) {
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
};
    
exports.tasks = function (project) {
    return [
        {
            'name': 'add_image',
            'label': 'Add an Image',
            'description': 'Upload a picture or video for your project page',
            'fullText': 'This would be the full text for a popup sort of thing',
            'points': 10,
            'form': {
                'project-image': {
                    'type': 'file',
                    'label': 'Upload an image',
                    'help': 'To upload an image...'
                }
            },
            'completed': function () {
                return project.hasOwnProperty('youtube_id') ||
                       (project.hasOwnProperty('_attachments') &&
                        project._attachments.hasOwnProperty('project-image'));
            },
            'action': 'actions/project-actions/add-image.ejs'
        },
// http://ourblocks.net/national-night-out-resources-and-ideas/
// http://www.cityofpaloalto.org/civica/filebank/blobdload.asp?BlobID=12378
        {
            'name': 'team',
            'label': 'Contact Neighbors',
            'description': 'Contact neighbors for interest (see who wants to have a party!) Jot down names of those willing to help organize the event.',
            'fullText': '',
            'points': 0,
            'form': {
            },
            'completed': function () {
                return false;
            },
            'action': 'actions/project-actions/stub.ejs'
        },
        {
            'name': 'meeting',
            'label': 'Have a Planning Meeting',
            'description': 'You may want to schedule a planning meeting to decide on a few items in your todo list, such as: Theme, location, and assignments for food, decorations, games, set-up, and clean-up.',
            'fullText': '',
            'points': 0,
            'form': {
            },
            'completed': function () {
                return false;
            },
            'action': 'actions/project-actions/stub.ejs'
        },
        {
            'name': 'partners',
            'label': 'Identify Local Partners',
            'description': '',
            'fullText': '',
            'points': 0,
            'form': {
            },
            'completed': function () {
                return false;
            },
            'action': 'actions/project-actions/stub.ejs'
        },
        {
            'name': 'food',
            'description': "Serve food, but keep it simple: Watermelon, Lemonade, Coffee, tea and dessert, Ice cream cones, Pretzels and chips, Fruit and cheese plates, Pizza, Cookies, Hamburgers, Hot dogs, Corn on the cob, Salads.",
            'label': 'Plan the Food',
            'fullText': '',
            'points': 0,
            'form': {
            },
            'completed': function () {
                return false;
            },
            'action': 'actions/project-actions/stub.ejs'
        },
        {
            'name': 'entertainment',
            'label': 'Plan Entertainment',
            'description': "Have fun: Bike parade, Board games, Skits, Make a mural or banner, Coloring Contest, Pony rides, 3-legged race, Football, baseball, basketball, street hockey, Roller blade, Youth parade with a theme, Jump rope, Chalk art, Face painting, Bubbles, Sack races, Magic show, Sing-alongs, Water balloons, Frisbee competition, Piñata, Clowns, Bike Safety, Child ID Kits, Block party, Cookout, Parade, Jump rope contest, Hula hoop contest, Barbecue, Street dance, Volleyball, Storytelling (truth or fiction), Celebrate birthdays, anniversaries, graduations, Scavenger hunt, Take lots of pictures, Karaoke, Rummage sale, Music and DJ, Dunk tank, Movies, Sandy beach party, Street carnival, Disposable camera distribution/photo contest, Self-defense demonstration, Jail & Bail, K-9 demonstration, Funniest hat contest, Welcome new neighbors, Live music, Horseshoes",
            'fullText': '',
            'points': 0,
            'form': {
            },
            'completed': function () {
                return false;
            },
            'action': 'actions/project-actions/plan-entertainment.ejs'
        },
        {
            'name': 'mixer',
            'label': 'Design a Mixer',
            'description': "Facilitate conversations: Get your neighbors to know each other. Design a mixer: “Find a person who…” – with prizes, Block history stories, National Night Out stories, Photos from past block parties and NNO events, Oldest resident award, Longest resident award, Newest resident award.",
            'fullText': '',
            'points': 0,
            'form': {
            },
            'completed': function () {
                return false;
            },
            'action': 'actions/project-actions/stub.ejs'
        },
        {
            'name': 'future',
            'label': 'Keep it Going!',
            'description': "Do something for the community: Collect for a food bank, Beautify a common area, Plan a fall clean-up or bulb planting, Recruit additional Neighborhood Watch leaders and block captains, Discuss neighborhood problems & opportunities, Distribute neighborhood block list.",
            'fullText': '',
            'points': 0,
            'form': {
            },
            'completed': function () {
                return false;
            },
            'action': 'actions/project-actions/stub.ejs'
        }
    ]
};
    
exports.support = function (project, callback) {
    this.db.merge(project, function(err, resp) {
        callback(err, resp);
    });
};
    
exports.save = function(project, callback) {    
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
};

/**
 * Get projects by creator
 */
exports.getByCreator = function(uid, callback) {
    this.db.view('projectviews/bycreator', { 'key': uid }, function(err, objects) {
        var objects = objects || {};

        callback(objects);
    });
};

/**
 * Get projects by support uid
 */
exports.getBySupporter = function(uid, callback) {
    this.db.view('projectviews/bysupporters', { 'key': uid }, function(err, objects) {
        var objects = objects || {};

        callback(objects);
    });
};

/**
 * Support a project.
 */
exports.support = function (project, callback) {
    this.db.merge(project, function(err, resp) {
        callback(err, resp);
    });
};
