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
        }, function (err) {
            console.error('Load customers failed', err);
        });
    };

    // Create customer
    $scope.createCustomer = function () {
        $http.post(API_URL, $scope.customer).then(function () {
            $scope.customer = {};
            $scope.loadCustomers();
        }, function (err) {
            console.error('Create customer failed', err);
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
        if (!$scope.editId) return;
        $http.put(API_URL + $scope.editId + "/", $scope.customer)
            .then(function () {
                $scope.cancelEdit();
                $scope.loadCustomers();
            }, function (err) {
                console.error('Update customer failed', err);
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
            }, function (err) {
                console.error('Delete customer failed', err);
            });
        }
    };

    // Initial load
    $scope.loadCustomers();
});

/* small profile controller and logout helper */
(function(){
  angular.module('auctionApp')
  .controller('ProfileController', ['$scope','$http', function($scope,$http){
    $scope.profile = {};
    $scope.error = '';
    var BACKEND = window.BACKEND || 'http://127.0.0.1:8000';

    $scope.loadProfile = function(){
      $http.get(BACKEND + '/user/profile/', { withCredentials: true })
      .then(function(resp){ $scope.profile = resp.data; })
      .catch(function(){ $scope.error = 'Could not load profile'; });
    };

    $scope.logout = function(){
      $http.post(BACKEND + '/user/logout/', {}, { withCredentials: true })
      .finally(function(){
        window.localStorage.removeItem('auth');
        window.location.href = 'index.html';
      });
    };

    $scope.loadProfile();
  }]);
})();