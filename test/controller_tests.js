process.env.NODE_ENV = 'test';

assert = require('assert');
controllers = require('controllers');

module.exports = {

    'write some tests' : function() {
        assert.equal(true, true);
    }

};