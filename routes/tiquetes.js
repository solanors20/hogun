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
	router.post('/agregar', function	(req, res){
		var info = req.body.data;
		if(req.body.data){
			pool.getConnection(function(err, connection) {
				connection.query('CALL agregarTiquetes(?)', [req.body.data], function(error, filas){
			      	if(error){
			         	res.json({"Error" :  error });
			      	}else{
			      		res.json({"Success" : "Se agrego exitosamente"});
			      	}
	   			});
				connection.release();
			});	
		}else{
			res.json({"Error" : "Parametros no validos"});
		}
	});

	router.post('/listar', isAuthenticated, function (req, res) {
		if(req.body.fecha == null || req.body.busSeleccionado == null || req.body.rutaSeleccionada == null 
			|| req.body.busSeleccionado.id == null || req.body.rutaSeleccionada.idRuta == null){
			res.json([]);
			return;
		}
		pool.getConnection(function(err, connection) {
			connection.query('SELECT DATE_FORMAT(fecha, \'\%d-\%m-\%Y \%h:\%i \%p\') as fecha, a.nombre as origen, b.nombre as destino, t.total, t.numeropasajes as cantidad, t.adultomayor as cedula from tiquete t inner join region a on t.origen = a.idregion inner join region b on t.origen = b.idregion where date(fecha) = ? and t.bus = ? and t.ruta = ?', [req.body.fecha, req.body.busSeleccionado.id, req.body.rutaSeleccionada.idRuta], function(error, filas, resultado){
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