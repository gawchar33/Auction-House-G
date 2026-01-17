var app = angular.module('auctionApp', []);

app.controller('MainController', function ($scope, $http) {

    const USER_API = "http://127.0.0.1:8000/user/";
    const PRODUCT_API = "http://127.0.0.1:8000/product/";
    const CATEGORY_API = "http://127.0.0.1:8000/category/";

    // State
    $scope.page = 'home';
    $scope.loggedIn = false;
    $scope.currentUser = {};

    // Navigation
    $scope.setPage = function (page) {
        $scope.page = page;
    };

    // Signup
    $scope.signupUser = function () {
        $http.post(USER_API, $scope.signup).then(function () {
            alert("Signup successful");
            $scope.signup = {};
            $scope.page = 'login';
        }, function () {
            alert("Signup failed");
        });
    };

    // Login (basic learning version)
    $scope.loginUser = function () {
        $http.get(USER_API).then(function (response) {
            var user = response.data.find(
                u => u.username === $scope.login.username
            );

            if (user) {
                $scope.loggedIn = true;
                $scope.currentUser = user;
                $scope.page = 'profile';
            } else {
                alert("Invalid username");
            }
        });
    };

    // Logout
    $scope.logout = function () {
        $scope.loggedIn = false;
        $scope.currentUser = {};
        $scope.page = 'home';
    };

    // Load public data
    $http.get(PRODUCT_API).then(res => $scope.products = res.data);
    $http.get(CATEGORY_API).then(res => $scope.categories = res.data);
});
