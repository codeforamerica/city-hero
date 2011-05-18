process.env.NODE_ENV = 'test';

assert = require('assert');
views = require('../lib/views');

module.exports = {
    'homepage view should contain expected context' : function() {
    },
    
    'project wizard view should contain expected context' : function() {
        wizard = views.ProjectWizard.getView(function(context) {
            assert.equal(context.pageTitle, 'Start a Project');
            assert.deepEqual(context.contentMain, ['pages/content.project-wizard.ejs']);
        });
    }
}
