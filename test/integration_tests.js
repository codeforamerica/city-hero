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
        
            // Check that the project context is as expected
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
    }
}
