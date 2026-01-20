var app = angular.module('categoryApp', []);

app.controller('CategoryController', function ($scope, $http) {

    const API_URL = "http://127.0.0.1:8000/category/";

    $scope.categories = [];
    $scope.category = {};
    $scope.editMode = false;
    $scope.editId = null;
    $scope.status = '';

    // Load categories
    $scope.loadCategories = function () {
        $scope.status = 'Loading...';
        $http.get(API_URL).then(function (response) {
            $scope.categories = response.data;
            $scope.status = '';
        }, function (err) {
            $scope.status = 'Load failed';
            console.error('Load categories failed', err);
        });
    };

    // Create category
    $scope.createCategory = function () {
        $scope.status = 'Creating...';
        $http.post(API_URL, $scope.category).then(function () {
            $scope.category = {};
            $scope.loadCategories();
            $scope.status = 'Created';
        }, function (err) {
            $scope.status = 'Create failed';
            console.error('Create category failed', err);
        });
    };

    // Edit category (fill form)
    $scope.editCategory = function (category) {
        $scope.category = angular.copy(category);
        $scope.editId = category.id;
        $scope.editMode = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Update category
    $scope.updateCategory = function () {
        if (!$scope.editId) return;
        $scope.status = 'Updating...';
        $http.put(API_URL + $scope.editId + "/", $scope.category)
            .then(function () {
                $scope.cancelEdit();
                $scope.loadCategories();
                $scope.status = 'Updated';
            }, function (err) {
                $scope.status = 'Update failed';
                console.error('Update category failed', err);
            });
    };

    // Cancel edit
    $scope.cancelEdit = function () {
        $scope.category = {};
        $scope.editId = null;
        $scope.editMode = false;
        $scope.status = '';
    };

    // Delete category
    $scope.deleteCategory = function (id) {
        if (confirm("Are you sure?")) {
            $scope.status = 'Deleting...';
            $http.delete(API_URL + id + "/").then(function () {
                $scope.loadCategories();
                $scope.status = 'Deleted';
            }, function (err) {
                $scope.status = 'Delete failed';
                console.error('Delete category failed', err);
            });
        }
    };

    // Initial load
    $scope.loadCategories();
});

(function(){
  // attach to auctionApp (must match ng-app in HTML / app.js)
  var app = angular.module('auctionApp');

  app.controller('CategoryController', ['$scope','$http', function($scope,$http){
    var BACKEND = window.BACKEND || 'http://127.0.0.1:8000';
    var API = BACKEND.replace(/\/$/,'') + '/category/';

    function cfg(){ return { withCredentials: true }; }

    $scope.categories = [];
    $scope.category = {};
    $scope.editMode = false;
    $scope.editId = null;
    $scope.loading = false;
    $scope.status = '';
    $scope.error = '';

    function normalizeList(data){
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (data.results) return data.results;
      // fallback if API wraps payload differently
      return data.data || [];
    }

    $scope.load = function(){
      $scope.loading = true;
      $scope.error = '';
      $http.get(API, cfg())
        .then(function(resp){
          $scope.categories = normalizeList(resp.data);
          $scope.loading = false;
        })
        .catch(function(err){
          $scope.loading = false;
          $scope.error = (err.data && (err.data.detail || err.data.error)) || 'Failed to load categories';
          console.error('Load categories failed', err);
        });
    };

    $scope.loadCategories = $scope.load;

    $scope.createCategory = function(){
      $scope.status = 'Creating...';
      $http.post(API, $scope.category, cfg())
        .then(function(){
          $scope.category = {};
          $scope.load();
          $scope.status = 'Created';
        })
        .catch(function(err){
          $scope.status = 'Create failed';
          console.error('Create category failed', err);
        });
    };

    $scope.editCategory = function(category){
      $scope.category = angular.copy(category);
      $scope.editId = category.id;
      $scope.editMode = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    $scope.updateCategory = function(){
      if(!$scope.editId) return;
      $scope.status = 'Updating...';
      $http.put(API + $scope.editId + '/', $scope.category, cfg())
        .then(function(){
          $scope.cancelEdit();
          $scope.load();
          $scope.status = 'Updated';
        })
        .catch(function(err){
          $scope.status = 'Update failed';
          console.error('Update category failed', err);
        });
    };

    $scope.cancelEdit = function(){
      $scope.category = {};
      $scope.editId = null;
      $scope.editMode = false;
      $scope.status = '';
    };

    $scope.deleteCategory = function(id){
      if(confirm("Are you sure?")){
        $scope.status = 'Deleting...';
        $http.delete(API + id + '/', cfg())
          .then(function(){
            $scope.load();
            $scope.status = 'Deleted';
          })
          .catch(function(err){
            $scope.status = 'Delete failed';
            console.error('Delete category failed', err);
          });
      }
    };

    // Initial load
    $scope.load();
  }]);
})();
