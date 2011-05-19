process.env.NODE_ENV = 'test';

var assert = require('assert')
  , app = require('server').app
  , cradle = require('cradle')
  , auth = require('settings/auth')

module.exports = {
    'test that the home page gives us a 200 status' : function() {
        assert.response(app,
            { url: '/', headers: {'Host': 'cityheroes.in'} },
            function(res) {
//                console.log(res.body);
                assert.equal(res.statusCode, 200);
            });
    },
    
    'test that the add project form page gives us a 200 status' : function() {
        assert.response(app,
            { url: '/projects/add', headers: {'Host': 'cityheroes.in'} },
            function(res) {
//                console.log(res.body);
                assert.equal(res.statusCode, 200);
            });
    },
    
    'test that the project wizard page gives us a 200 status' : function() {
        assert.response(app,
            { url: '/projects/wizard', headers: {'Host': 'cityheroes.in'} },
            function(res) {
//                console.log(res.body);
                assert.equal(res.statusCode, 200);
            });
    },
    
    'test that an individual project page gives us a 200 status' : function() {
        var conn = new (cradle.Connection)(auth.db.host, auth.db.port);
        var db = conn.database('projects');
        
        // First let's create a project for us to use.
        var project = {
            _id: 'testProject1',
            info: 'blah',
            title: 'wonderful'
        }
        
        db.save(project, function(err, dbRes) {
        
            assert.response(app,
                { url: '/projects/' + dbRes._id, headers: {'Host': 'cityheroes.in'} },
                function(res) {
//                    console.log(res.body);
                    assert.equal(res.statusCode, 200);
            
                    // Now get rid of that pesky testing project.
                    db.remove(dbRes._id, dbRes._rev);
                });
            
            console.log('The id and revision:')
            console.log(dbRes._id + ', ' + dbRes._rev)
        });
    }
}
