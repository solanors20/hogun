var express = require('express');
var app = express();
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var multer = require('multer');
var mysql = require('mysql');
var fs = require("fs");
var jwt    = require('jsonwebtoken');
var config = require('./config'); // get our config file
var connection = mysql.createConnection({
   host: 'localhost',
   user: 'root',
   password: '',
   database: 'busticketdb',
   port: 3306
});
// Configuring Passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var expressSession = require('express-session');
var bCrypt = require('bcrypt-nodejs');
var flash = require('connect-flash');

//app.set('superSecret', config.secret); // secret variable
/**app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});*/

// Localización de los ficheros estaticos
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json({limit: '50mb'}));                                     // parse application/json
app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));

app.use(expressSession({secret: 'aff123s',
    resave: true,
    saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// Passport needs to be able to serialize and deserialize users to support persistent login sessions
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	connection.query('SELECT * FROM usuario where id = ?', [id], function(error, filas, resultado){
    if(error){
       return done(error);
    }else{
       if(resultado.length > 0){
       	done(error, filas[0]);
       }
    }
  });
});

var isValidPassword = function(user, password){
        return bCrypt.compareSync(password, user.clave);
}

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

app.get('/signout', function(req, res) {
  req.logout();
  res.redirect('/');
});
// passport/login.js
passport.use('login', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) { 
    connection.query('SELECT * FROM usuario where cedula = ?', [username], function(error, filas, resultado){
      if(error){
         return done(error);
      }else{
         if(filas.length > 0){
         	if (!isValidPassword(filas[0], password)){
	          return done(null, false, 
	              req.flash('message', 'Invalid Password'));
	        }
	        // User and password both match, return user from 
	        // done method which will be treated like success
	        return done(null, filas[0]);
         }else{
          	return done(null, false, 
                req.flash('message', 'User Not found.')); 
         }
      }
   });
}));



app.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
}));

app.get('/', function(req, res) { 
    res.sendFile(__dirname + '/public/auth.html');            
});

app.get('/home', isAuthenticated, function(req, res){
	res.sendFile(__dirname + '/public/home.html');
});

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


app.get('/rutas/listar/', function (req, res) {
	if(req.query.placa){
	 	connection.query('CALL listarRutasPorBus(?)', [req.query.placa], function(error, filas){
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

app.post('/cedulas/subir', function(request, response) {
  	var bitmap = new Buffer(request.body.imagen, 'base64');
  	var fecha = new Date();
  	var mes = fecha.getMonth() + 1;
  	var anio = fecha.getFullYear();
  	var directorio = "./public/cedulas/" + mes + "_" + anio +"/";
  	var respuesta = {};
  	var error = false;
  	try{
  		if(fsExisteSync(directorio)){
  		if(!fsExisteSync(directorio + request.body.nombre)){
  			fs.writeFileSync(directorio + request.body.nombre, bitmap);
  		}
	  	}else{
	  		fs.mkdirSync(directorio);
	  		fs.writeFileSync(directorio + request.body.nombre, bitmap);
	  	}
  	}catch(e){
  		error = true;
  	}
  	if(!error){
  		respuesta = {"Success" : "Se guardo la imagen con exito."};	
  	}
  	response.json(respuesta);
});

function fsExisteSync(ruta) {
  try {
    fs.accessSync(ruta);
    return true;
  } catch (e) {
    return false;
  }
}




app.get('/resumen', isAuthenticated, function (req, res) {
	connection.query('SELECT Ruta.nombre, SUM(TOTAL) total FROM Tiquete inner join Ruta on Tiquete.ruta = Ruta.idRuta', function(error, filas, resultado){
      if(error){
        res.send(error);
      }else{
        res.json(filas);
      }
   });

});


app.post('/resumen', isAuthenticated, function (req, res) {
	
connection.query('SELECT Ruta.nombre, SUM(TOTAL) total FROM Tiquete inner join Ruta on Tiquete.ruta = Ruta.idRuta where date(fecha) = ?', [req.body.fecha], function(error, filas, resultado){
      if(error){
         res.send(error);
      }else{
         res.json(filas);
      }
   });
});

app.get('/buses/listar', isAuthenticated, function(req, res){
  connection.query('SELECT id, placa FROM bus b inner join busesxusuario bu on b.id = bu.bus where usuario = ?', [req.user.id], function(error, filas, resultado){
      if(error){
        res.send(error);
      }else{
        res.json(filas);
      }
   });
});

app.get('/rutas/dropdown', isAuthenticated, function (req, res) {
  
connection.query('SELECT r.idRuta, r.nombre FROM ruta r inner join busesxruta br on r.idRuta = br.ruta inner join bus b on br.bus = b.id inner join busesxusuario bu on b.id = bu.bus where usuario = ?', [req.user.id], function(error, filas, resultado){
      if(error){
        res.send(error);
      }else{
        res.json(filas);
      }
   });
});

app.post('/tiquetes/listar', isAuthenticated, function (req, res) {
connection.query('SELECT DATE_FORMAT(fecha, \'\%d-\%m-\%Y \%h:\%i \%p\') as fecha, a.nombre as origen, b.nombre as destino, t.total, t.numeroPasajes as cantidad, t.adultoMayor as cedula FROM Tiquete t inner join Region a on t.origen = a.idRegion inner join Region b on t.origen = b.idRegion where date(fecha) = ? and t.bus = ? and t.ruta = ?', [req.body.fecha, req.body.busSeleccionado.id, req.body.rutaSeleccionada.idRuta], function(error, filas, resultado){
      if(error){
         res.send(error);
      }else{
        res.json(filas);
      }
   });
});

var server = app.listen(8080, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});