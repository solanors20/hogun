var adminSite = angular.module('TicketSystem', ['ngRoute']);

// configure our routes
    adminSite.config(function($routeProvider) {
        $routeProvider

            // route for the home page
            .when('/', {
                templateUrl : 'resumen.html',
                controller  : 'resumenController'
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


 

