var app = angular.module('customerApp', []);

app.controller('CustomerController', function ($scope, $http) {

    const API_URL = "http://127.0.0.1:8000/customer/";

    $scope.customers = [];
    $scope.customer = {};
    $scope.editMode = false;
    $scope.editId = null;

    // Load customers
    $scope.loadCustomers = function () {
        $http.get(API_URL).then(function (response) {
            $scope.customers = response.data;
        });
    };

    // Create customer
    $scope.createCustomer = function () {
        $http.post(API_URL, $scope.customer).then(function () {
            $scope.customer = {};
            $scope.loadCustomers();
        });
    };

    // Edit customer (fill form)
    $scope.editCustomer = function (customer) {
        $scope.customer = angular.copy(customer);
        $scope.editId = customer.id;
        $scope.editMode = true;
    };

    // Update customer
    $scope.updateCustomer = function () {
        $http.put(API_URL + $scope.editId + "/", $scope.customer)
            .then(function () {
                $scope.cancelEdit();
                $scope.loadCustomers();
            });
    };

    // Cancel edit
    $scope.cancelEdit = function () {
        $scope.customer = {};
        $scope.editId = null;
        $scope.editMode = false;
    };

    // Delete customer
    $scope.deleteCustomer = function (id) {
        if (confirm("Are you sure?")) {
            $http.delete(API_URL + id + "/").then(function () {
                $scope.loadCustomers();
            });
        }
    };

    // Initial load
    $scope.loadCustomers();
});
