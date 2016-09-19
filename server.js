var express = require('express');
var app = express();
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var multer = require('multer');
var mysql = require('mysql');
var fs = require("fs");
var handlebars = require('handlebars');
var jwt    = require('jsonwebtoken');
var config = require('./config'); // get our config file
var pool = mysql.createPool({
  connectionLimit : 15,
  host            : '',
  user            : '',
  password        : '',
  database        : ''
});
// Configuring Passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var expressSession = require('express-session');
var bCrypt = require('bcrypt-nodejs');
var flash = require('connect-flash');

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
app.use('/rutas', require('./routes/rutas.js')(pool));
app.use('/tarifas', require('./routes/tarifas.js')(pool));
app.use('/regiones', require('./routes/regiones.js')(pool));
app.use('/paradas', require('./routes/paradas.js')(pool));
app.use('/tiquetes', require('./routes/tiquetes.js')(pool));

// Passport needs to be able to serialize and deserialize users to support persistent login sessions
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  pool.getConnection(function(err, connection) {
    connection.query('SELECT * FROM usuario where id = ?', [id], function(error, filas, resultado){
      if(error){
         return done(error);
      }else{
         if(resultado.length > 0){
          done(error, filas[0]);
         }
      }
    });
    connection.release();
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
    pool.getConnection(function(err, connection) {
      connection.query('SELECT * FROM usuario where cedula = ?', [username], function(error, filas, resultado){
        if(error){
           return done(error);
        }else{
           if(filas.length > 0){
            if (!isValidPassword(filas[0], password)){
              return done(null, false, 
                  req.flash('message', 'Clave no válida.'));
            }
            // User and password both match, return user from 
            // done method which will be treated like success
            return done(null, filas[0]);
           }else{
              return done(null, false, 
                  req.flash('message', 'Usuario no válido.')); 
           }
        }
      });
      connection.release();
    });
}));



app.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
}));

app.get('/', function(req, res) {
  // read the file and use the callback to render
  fs.readFile(__dirname + '/public/auth.html', function(err, data){
    if (!err) {
      // make the buffer into a string
      var source = data.toString();
      // call the render function
      res.send(renderToString(source, { message: req.flash('message') }));
    } else {
      res.send('error');
    }
  }); 
  
    //res.sendFile(__dirname + '/public/auth.html');            
});

function renderToString(source, data) {
  var template = handlebars.compile(source);
  var outputString = template(data);
  return outputString;
}

app.get('/home', isAuthenticated, function(req, res){
	res.sendFile(__dirname + '/public/home.html');
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
  pool.getConnection(function(err, connection) {
    connection.query('select ruta.nombre, sum(total) total from tiquete inner join ruta on tiquete.ruta = ruta.idruta group by ruta.nombre', function(error, filas, resultado){
      if(error){
        res.send(error);
      }else{
        res.json(filas);
      }
    });
    connection.release();
  });	
});


app.post('/resumen', isAuthenticated, function (req, res) {
  pool.getConnection(function(err, connection) {
    connection.query('select r.nombre, b.placa, sum(total) total from tiquete t inner join ruta r on t.ruta = r.idruta inner join bus b on t.bus = b.id where date(t.fecha) = ? group by r.nombre,b.placa', [req.body.fecha], function(error, filas, resultado){
        if(error){
           res.send(error);
        }else{
           res.json(filas);
        }
     });
    connection.release();
  });	
});

app.get('/buses/listar', isAuthenticated, function(req, res){
  pool.getConnection(function(err, connection) {
    connection.query('select id, placa from bus b inner join busesxusuario bu on b.id = bu.bus where usuario = ?', [req.user.id], function(error, filas, resultado){
      if(error){
        res.send(error);
      }else{
        res.json(filas);
      }
    });
    connection.release();
  });
});

var server = app.listen(8080, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});