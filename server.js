var express = require('express');
var app = express();
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var mysql = require('mysql');
var connection = mysql.createConnection({
   host: 'localhost',
   user: 'root',
   password: 'le0r0ck$!',
   database: 'busticketdb',
   port: 3306
});
    // Localización de los ficheros estÃ¡ticos
    app.use(express.static(__dirname + '/public'));
	app.use(bodyParser.json());                                     // parse application/json
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






app.get('/resumen', function (req, res) {
	connection.query('SELECT Ruta.nombre, SUM(TOTAL) total FROM Tiquete inner join Ruta on Tiquete.ruta = Ruta.idRuta', function(error, filas, resultado){
      if(error){
         res.send(error);
      }else{
         if(resultado.length > 0){
            res.json(filas);
         }else{
            console.log('Registro no encontrado');
         }
      }
   });

})


app.post('/resumen', function (req, res) {
	console.log(req.body.fecha);
connection.query('SELECT Ruta.nombre, SUM(TOTAL) total FROM Tiquete inner join Ruta on Tiquete.ruta = Ruta.idRuta where date(fecha) = ?', [req.body.fecha], function(error, filas, resultado){
      if(error){
         res.send(error);
      }else{
         if(resultado.length > 0){
            res.json(filas);
         }else{
            console.log('Registro no encontrado');
         }
      }
   });
})




app.get('/', function(req, res) {  
    res.sendFile('./public/index.html');            
});

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});