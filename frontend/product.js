var app = angular.module('productApp', []);

app.controller('ProductController', function ($scope, $http) {

    const API_URL = "http://127.0.0.1:8000/product/";

    $scope.products = [];
    $scope.product = {};
    $scope.editMode = false;
    $scope.editId = null;

    // Load products
    $scope.loadProducts = function () {
        $http.get(API_URL).then(function (response) {
            $scope.products = response.data;
        });
    };

    // Create product
    $scope.createProduct = function () {
        $http.post(API_URL, $scope.product).then(function () {
            $scope.product = {};
            $scope.loadProducts();
        });
    };

    // Edit product
    $scope.editProduct = function (product) {
        $scope.product = angular.copy(product);
        $scope.editId = product.id;
        $scope.editMode = true;
    };

    // Update product
    $scope.updateProduct = function () {
        $http.put(API_URL + $scope.editId + "/", $scope.product)
            .then(function () {
                $scope.cancelEdit();
                $scope.loadProducts();
            });
    };

    // Cancel edit
    $scope.cancelEdit = function () {
        $scope.product = {};
        $scope.editId = null;
        $scope.editMode = false;
    };

    // Delete product
    $scope.deleteProduct = function (id) {
        if (confirm("Are you sure?")) {
            $http.delete(API_URL + id + "/").then(function () {
                $scope.loadProducts();
            });
        }
    };

    // Initial load
    $scope.loadProducts();
});
