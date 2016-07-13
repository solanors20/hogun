var express = require('express');
var app = express();
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var mysql = require('mysql');
var connection = mysql.createConnection({
   host: 'localhost',
   user: 'root',
   password: 'le0r0ck$!',
   database: 'BusTicketDB',
   port: 3306
});

app.use(bodyParser.urlencoded({extended: true}));  

app.get('/tarifas/listar/', function (req, res) {
	if(req.query.placa){
	 	connection.query('CALL listarTarifasPorBus(?)', [req.query.placa], function(error, filas){
	      	if(error){
	         	res.send(error);
	      	}else{
	      		res.json(filas[0]);
	      	}
   		});	
	}else if (req.query.ruta){
		connection.query('CALL listarTarifasPorRuta(?)', [req.query.ruta], function(error, filas){
		    if(error){
		        res.send(error);
		    }else{
		      res.json(filas[0]);
		    }
		});
	}else{
		res.json([]);
	}
});

app.get('/regiones/listar/', function (req, res) {
	connection.query('CALL listarRegiones()', function(error, filas){
	    if(error){
	        res.send(error);
	    }else{
	      res.json(filas[0]);
	    }
	});
});

app.get('/paradas/listar/', function (req, res) {
	if(req.query.placa){
	 	connection.query('CALL listarParadasPorBus(?)', [req.query.placa], function(error, filas){
	      	if(error){
	         	res.send(error);
	      	}else{
	      		res.json(filas[0]);
	      	}
   		});	
	}else{
		res.json([]);
	}
});

app.post('/tiquetes/agregar', function	(req, res){
	var info = req.body.data;
	if(req.body.data){
	 	connection.query('CALL agregarTiquetes(?)', [req.body.data], function(error, filas){
	      	if(error){
	         	res.json({"Error" :  error });
	      	}else{
	      		res.json({"Success" : "Se agrego exitosamente"});
	      	}
   		});	
	}else{
		res.json({"Error" : "Parametros no validos"});
	}
});

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});