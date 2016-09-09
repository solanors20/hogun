var adminSite = angular.module('TicketSystem', ['ngRoute', 'angular-table']);

// configure our routes
    adminSite.config(function($routeProvider) {
        $routeProvider

            // route for the home page
            .when('/', {
                templateUrl : 'resumen.html',
                controller  : 'resumenController'
            })
            .when('/resumen', {
                templateUrl : 'resumen.html',
                controller  : 'resumenController'
            })
            .when('/tiquetes', {
                templateUrl : 'tiquetes.html',
                controller  : 'tiquetesController'
            })
    });

    adminSite.controller('resumenController', function($scope, $http) {  
        var myDate = new Date();
var prettyDate =myDate.getFullYear() + '/' +(myDate.getMonth()+1) + '/' + myDate.getDate();
        $scope.formData = {};
        $scope.formData.fecha = prettyDate;
         $http.post('/resumen', $scope.formData)
            .success(function(data) {

                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

                        // when submitting the add form, send the text to the node API
    $scope.obtenerResumen = function() {
        $http.post('/resumen', $scope.formData)
            .success(function(data) {

                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    });

    adminSite.controller('tiquetesController', function($scope, $http) { 
        $scope.config = {
            itemsPerPage: 15,
            fillLastPage: true
        } 
        $http.get('/buses/listar')
            .success(function(data) {

                $scope.buses = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

            $http.get('/rutas/dropdown')
            .success(function(data) {

                $scope.rutas = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });

            $scope.obtenerTiquetes = function() {
                $scope.formData.busSeleccionado = $scope.busSeleccionado;
                $scope.formData.rutaSeleccionada = $scope.rutaSeleccionada;
        $http.post('/tiquetes/listar', $scope.formData)
            .success(function(data) {

                $scope.tiquetes = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
    });


 

