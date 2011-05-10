/**
 * @fileoverview Main routes for city-hero application
 */
 
/**
 * Class Set all router.
 * @param {object} App object (probably express)
 */
function set_routes(app) {

  // Project page (this is currently just an example)
  app.get('/project', function(req, res) {
    res.render('project.view.ejs');
  });
};

// Publicize functions
exports.set_routes = set_routes;
