/**
 * @fileoverview Main routes for city-hero application
 */

controllers = require('./controllers');
 
/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
function set_routes(app) {
  
    // Home
    app.get('/', function(req, res) {
        res.render('home.view.ejs');
    });

    // Project page (this is currently just an example)
    app.get('/project', function(req, res) {
        controllers.Projects.retrieve(req, res, function(context) {
            res.render('project.view.ejs', context);
        });
    });

    // Project add page
    app.get('/project/add', function(req, res) {
        res.render('project-add.view.ejs');
    });
    
    app.post('/project/add', function(req, res) {
        contollers.Projects.create_project(req, res, function(context) {
            res.redirect('/project');
        });
    });
};

// Publicize functions
exports.set_routes = set_routes;
