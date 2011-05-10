/**
 * @fileoverview Main routes for city-hero application
 */
 
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
    res.render('project.view.ejs');
  });
  
  // Project add page
  app.get('/project/add', function(req, res) {
    res.render('project-add.view.ejs');
  });
};

// Publicize functions
exports.set_routes = set_routes;
