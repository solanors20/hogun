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
				connection.query('CALL listarRutasPorBus(?)', [req.query.placa], function(error, filas){
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

	router.get('/dropdown', isAuthenticated, function (req, res) {
		pool.getConnection(function(err, connection) {
			connection.query('select r.idRuta, r.nombre from ruta r inner join busesxruta br on r.idruta = br.ruta inner join bus b on br.bus = b.id inner join busesxusuario bu on b.id = bu.bus where usuario = ?', [req.user.id], function(error, filas, resultado){
		      if(error){
		        res.send(error);
		      }else{
		        res.json(filas);
		      }
		   	});	
			connection.release();
		});
		
	});

	return router;
};
