process.env.NODE_ENV = 'test';

var assert = require('assert')
  , cradle = require('cradle')
  , auth = require('settings/auth')

module.exports = {
    'test that the home page gives us a 200 status' : function() {
        var app = require('server').app
        assert.response(app,
            { url: '/', headers: {'Host': 'cityheroes.in'} },
            function(res) {
//                console.log(res.body);
                assert.equal(res.statusCode, 200);
            });
    },
    
    'test that the add project form page gives us a 200 status' : function() {
        var app = require('server').app
        assert.response(app,
            { url: '/projects/add', headers: {'Host': 'cityheroes.in'} },
            function(res) {
//                console.log(res.body);
                assert.equal(res.statusCode, 200);
            });
    },
    
    'test that the project wizard page gives us a 200 status' : function() {
        var app = require('server').app
        assert.response(app,
            { url: '/projects/wizard', headers: {'Host': 'cityheroes.in'} },
            function(res) {
//                console.log(res.body);
                assert.equal(res.statusCode, 200);
            });
    },
    
    'test routes, views, and controllers for an individual project' : function() {
        /**
         * Set up fixture; create a project in the database.  This will be the
         * Project whose project page we request.
         */
        function setup(test) {
            var app = require('server').app
            var conn = new (cradle.Connection)(auth.db.host, auth.db.port);
            var db = conn.database('projects');
            
            var project = {
                _id: 'testProject' + Math.random(),
                info: 'blah',
                title: 'wonderful'
            }
            
            db.save(project, function(err, dbRes) {
                assert.isNull(err);
                test(app, db, dbRes);
            });
        }
        
        /**
         * Tear down fixture; clean up the database by removing the project we
         * just created in set up.
         */
        function teardown(db, project) {
            db.remove(project._id, project._rev, function(err, dbRes) {
                assert.isNull(err);
                assert.isNotNull(dbRes);
            });
        }
        
        /**
         * Perform the tests
         */
        setup(function(app, db, project) {
        
            // Check that the response has a status code of 200
            assert.response(app,
                { url: '/projects/' + project._id, 
                  headers: {'Host': 'cityheroes.in'} },
                function(res) {
                    try {
                        assert.equal(res.statusCode, 200);
                    } finally {
                        teardown(db, project);
                    }
                });
        });
        
        setup(function(app, db, project) {
        
            // Check that the project context has the attributes from above
            views.projectDetailsPage(project._id, function(pageContext) {
                try {
                    assert.equal(pageContext.project._id, project.id);
                    assert.equal(pageContext.project._rev, project.rev);
                    assert.equal(pageContext.project.info, 'blah');
                    assert.equal(pageContext.project.title, 'wonderful');
                } finally {
                    teardown(db, project);
                }
            });
        });
    },
    
    
    'test routes, views, and controllers for creating a project' : function() {
        /**
         * Set up fixture; just get the database connection.
         */
        function setup(test) {
            var app = require('server').app
            var conn = new (cradle.Connection)(auth.db.host, auth.db.port);
            var db = conn.database('projects');
            
            test(app, db);
        }
        
        /**
         * Tear down fixture; clean up the database.
         */
        function teardown(db, project) {
            db.remove(project._id, project._rev, function(err, dbRes) {
                assert.isNull(err);
                assert.isNotNull(dbRes);
            });
        }
        
        /**
         * Perform the tests
         */
        setup(function(app, db) {
            
            // Test that we can add a project with no attachments
            assert.response(app,
                { url: '/projects/wizard',
                  method: 'POST',
                  headers: 
                    { 'Content-type': 'multipart/form-data; boundary=----WebKitFormBoundarysUTGv0XAU0FJgBQd',
                      'Host': 'chicken.local' },
                  body: '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-mission"\r\n' + '\r\n' + 'This is a test\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-mission-problem"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-mission-solution"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-mission-values"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-title"\r\n' + '\r\n' + 'Still a test\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-location"\r\n' + '\r\n' + 'Oakland, CA\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-lat"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-lon"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-image"; filename=""\r\n' + 'Content-Type: application/octet-stream\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-video"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-link"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-creator"\r\n' + '\r\n' + 'undefined\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd\r\n' + 'Content-Disposition: form-data; name="project-submit"\r\n' + '\r\n' + 'Submit\r\n' + '------WebKitFormBoundarysUTGv0XAU0FJgBQd--'},
                function(res) {
                    var redir = res.headers.location;
                    assert.isDefined(redir);
                    
                    var projid = redir.substr(30);
                    views.projectDetailsPage(projid, function(context) {
                        assert.isDefined(context.project);
                        assert.equal(project.description, 'This is a test');
                        assert.equal(project.title, 'Still a test');
                        assert.equal(project.location, 'Oakland, CA');
                        assert.isDefined(context.project._id);
                        assert.isDefined(context.project._rev);
                    });
                    
                    db.get(projid, function(err, project) {
                        try {
                            assert.isNull(err);
                        } finally {
                            teardown(db, project);
                        }
                    });
                    
                    assert.equal(res.statusCode, 302);
                    assert.equal(redir.substr(0,30), 'http://chicken.local/projects/');
                }
            );
        });
        
        setup(function(app, db) {
            
            // Test that we can add a project with an attachment
            assert.response(app,
                { url: '/projects/wizard',
                  method: 'POST',
                  headers: 
                    { 'Content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryn1IsGnrAwFp8EoCb',
                      'Host': 'chicken.local' },
                  body: '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-mission"\r\n' + '\r\n' + 'This is a test\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-mission-problem"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-mission-solution"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-mission-values"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-title"\r\n' + '\r\n' + 'Still a test\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-location"\r\n' + '\r\n' + 'Oakland, CA\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-lat"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-lon"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-image"; filename="anan_lg (copy).gif"\r\n' + 'Content-Type: image/gif\r\n' + '\r\n' + '1234567890\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-video"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-link"\r\n' + '\r\n' + '\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-creator"\r\n' + '\r\n' + 'undefined\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb\r\n' + 'Content-Disposition: form-data; name="project-submit"\r\n' + '\r\n' + 'Submit\r\n' + '------WebKitFormBoundaryn1IsGnrAwFp8EoCb--'},
                function(res) {
                    var redir = res.headers.location;
                    assert.isDefined(redir);
                    
                    var projid = redir.substr(30);
                    db.get(projid, function(err, project) {
                        try {
                            assert.isNull(err);
                            assert.equal(project.description, 'This is a test');
                            assert.equal(project.title, 'Still a test');
                            assert.equal(project.location, 'Oakland, CA');
                            assert.isDefined(project._attachments);
                            assert.ok(project._attachments.hasOwnProperty('project-image'));
                            assert.equal(project._attachments['project-image'].content_type, 'image/gif');
                            assert.equal(project._attachments['project-image'].length, 10);
                        } finally {
                            teardown(db, project);
                        }
                    });
                    
                    assert.equal(res.statusCode, 302);
                    assert.equal(redir.substr(0,30), 'http://chicken.local/projects/');
                }
            );
        });
    }
}
