var app = angular.module('userApp', []);

app.controller('UserController', function ($scope, $http) {

    const API_URL = "http://127.0.0.1:8000/user/";

    $scope.user = {};
    $scope.users = [];

    // GET USERS
    $scope.loadUsers = function () {
        $http.get(API_URL)
            .then(function (response) {
                $scope.users = response.data;
            }, function (error) {
                console.error(error);
            });
    };

    // CREATE OR UPDATE USER
    $scope.saveUser = function () {

        if ($scope.user.id) {
            // UPDATE USER
            $http.put(API_URL + $scope.user.id + "/", $scope.user)
                .then(function () {
                    alert("User updated successfully");
                    $scope.user = {};
                    $scope.loadUsers();
                }, function (error) {
                    console.error(error);
                });

        } else {
            // CREATE USER
            $http.post(API_URL, $scope.user)
                .then(function () {
                    alert("User created successfully");
                    $scope.user = {};
                    $scope.loadUsers();
                }, function (error) {
                    console.error(error);
                });
        }
    };

    // EDIT USER
    $scope.editUser = function (u) {
        $scope.user = angular.copy(u);
    };

    // CANCEL EDIT
    $scope.cancelEdit = function () {
        $scope.user = {};
    };

    // DELETE USER
    $scope.deleteUser = function (id) {
        if (confirm("Are you sure you want to delete this user?")) {
            $http.delete(API_URL + id + "/")
                .then(function () {
                    $scope.loadUsers();
                }, function (error) {
                    console.error(error);
                });
        }
    };

    // INITIAL LOAD
    $scope.loadUsers();
});
