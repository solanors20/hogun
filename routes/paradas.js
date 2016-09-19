var express = require('express')
  , router = express.Router()

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(pool) {
	router.get('/listar/', function (req, res) {
		if(req.query.placa){
			pool.getConnection(function(err, connection) {
				connection.query('CALL listarParadasPorBus(?)', [req.query.placa], function(error, filas){
			    	if(error){
			         	res.send(error);
			      	}else{
			      		res.json(filas[0]);
			      	}
		   		});
				connection.release();
			});	
		}else{
			res.json([]);
		}
	});

	return router;
};