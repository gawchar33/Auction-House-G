var app = angular.module('categoryApp', []);

app.controller('CategoryController', function ($scope, $http) {

    const API_URL = "http://127.0.0.1:8000/category/";

    $scope.categories = [];
    $scope.category = {};
    $scope.editMode = false;
    $scope.editId = null;

    // Load categories
    $scope.loadCategories = function () {
        $http.get(API_URL).then(function (response) {
            $scope.categories = response.data;
        });
    };

    // Create category
    $scope.createCategory = function () {
        $http.post(API_URL, $scope.category).then(function () {
            $scope.category = {};
            $scope.loadCategories();
        });
    };

    // Edit category
    $scope.editCategory = function (category) {
        $scope.category = angular.copy(category);
        $scope.editId = category.id;
        $scope.editMode = true;
    };

    // Update category
    $scope.updateCategory = function () {
        $http.put(API_URL + $scope.editId + "/", $scope.category)
            .then(function () {
                $scope.cancelEdit();
                $scope.loadCategories();
            });
    };

    // Cancel edit
    $scope.cancelEdit = function () {
        $scope.category = {};
        $scope.editId = null;
        $scope.editMode = false;
    };

    // Delete category
    $scope.deleteCategory = function (id) {
        if (confirm("Are you sure?")) {
            $http.delete(API_URL + id + "/").then(function () {
                $scope.loadCategories();
            });
        }
    };

    // Initial load
    $scope.loadCategories();
});
