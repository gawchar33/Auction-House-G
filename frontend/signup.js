var app = angular.module('app', []);

app.controller('SignupCtrl', function($scope, $http) {
    $scope.user = {};

    $scope.signup = function() {
        $http.post('http://127.0.0.1:8000/auth/signup/', $scope.user)
        .then(function(response) {
            $scope.message = "Signup successful. Please login.";
        }, function(error) {
            $scope.message = "Signup failed";
        });
    };
});
