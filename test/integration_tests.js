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
    
    'test that an individual project page gives us a 200 status' : function() {
        /**
         * Set up fixture; create a project in the database.  This will be the
         * Project whose project page we request.
         */
        function setup(test) {
            var app = require('server').app
            var conn = new (cradle.Connection)(auth.db.host, auth.db.port);
            var db = conn.database('projects');
            
            var project = {
                _id: 'testProject1',
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
            db.remove(project._id, project._rev);
        }
        
        /**
         * Perform the test
         */
        setup(function(app, db, project) {
        
            // Check that the response has a status code of 200
            assert.response(app,
                { url: '/projects/' + project._id, 
                  headers: {'Host': 'cityheroes.in'} },
                function(res) {
                    assert.equal(res.statusCode, 200);
                    
                    teardown(db, project);
                });
        });
    }
}
