
function set_routes(app) {
    app.get('/project', function(req, res) {
        res.render('project.view.ejs');
    });
};

exports.set_routes = set_routes;
