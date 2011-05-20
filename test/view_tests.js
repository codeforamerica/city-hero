process.env.NODE_ENV = 'test';

assert = require('assert');
views = require('views');

module.exports = {
    'homepage view should contain expected context' : function() {
    },
    /*
    'project creation view should contain expected context' : function() {
        wizard = views.projectForm(function(context) {
            assert.equal(context.pageTitle, 'Add a Project');
            assert.deepEqual(context.contentMain, ['pages/content.project-add.ejs']);
            assert.deepEqual(context.bodyClasses, ['project', 'project-add'])
        });
    },
    */
    
    'project wizard view should contain expected context' : function() {
        wizard = views.projectWizard(function(context) {
            assert.equal(context.pageTitle, 'Start a Project');
            assert.deepEqual(context.contentMain, ['pages/content.project-wizard.ejs']);
            assert.deepEqual(context.bodyClasses, ['project', 'project-wizard'])
        });
    }
}
