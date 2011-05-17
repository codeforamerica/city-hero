process.env.NODE_ENV = 'test';

assert = require('assert');
app = require('../lib/server').app;

module.exports = {
    'test that the home page gives us a 200 status' : function() {
        assert.response(app,
            { url: '/', headers: {'Host': 'cityheroes.in'} },
            function(res) {
                assert.equal(res.statusCode, 200);
            });
    }
}
