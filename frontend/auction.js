var app = angular.module('auctionApp', []);

app.controller('AuctionController', function ($scope, $http) {

    const API_URL = "http://127.0.0.1:8000/auction/";

    $scope.auctions = [];
    $scope.auction = {};
    $scope.editMode = false;
    $scope.editId = null;

    // Load auctions
    $scope.loadAuctions = function () {
        $http.get(API_URL).then(function (response) {
            $scope.auctions = response.data;
        });
    };

    // Create auction
    $scope.createAuction = function () {
        $http.post(API_URL, $scope.auction).then(function () {
            $scope.auction = {};
            $scope.loadAuctions();
        });
    };

    // Edit auction
    $scope.editAuction = function (auction) {
        $scope.auction = angular.copy(auction);
        $scope.editId = auction.id;
        $scope.editMode = true;
    };

    // Update auction
    $scope.updateAuction = function () {
        $http.put(API_URL + $scope.editId + "/", $scope.auction)
            .then(function () {
                $scope.cancelEdit();
                $scope.loadAuctions();
            });
    };

    // Cancel edit
    $scope.cancelEdit = function () {
        $scope.auction = {};
        $scope.editId = null;
        $scope.editMode = false;
    };

    // Delete auction
    $scope.deleteAuction = function (id) {
        if (confirm("Are you sure?")) {
            $http.delete(API_URL + id + "/").then(function () {
                $scope.loadAuctions();
            });
        }
    };

    // Initial load
    $scope.loadAuctions();
});
