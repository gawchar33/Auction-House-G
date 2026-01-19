var app = angular.module('auctionApp', []);

app.controller('AuctionController', function ($scope, $http) {
    const API_URL = "/auction/"; // relative path to Django endpoint

    $scope.auctions = [];
    $scope.auction = {};
    $scope.editMode = false;
    $scope.editId = null;

    // Normalize datetime-local value for server if needed
    function normalizeDate(dtString) {
        if (!dtString) return null;
        // keep as-is; server should accept ISO-8601-like string
        return dtString;
    }

    $scope.loadAuctions = function () {
        $http.get(API_URL).then(function (response) {
            $scope.auctions = response.data;
        });
    };

    $scope.createAuction = function () {
        const payload = angular.copy($scope.auction);
        payload.end_time = normalizeDate(payload.end_time);
        $http.post(API_URL, payload).then(function () {
            $scope.auction = {};
            $scope.loadAuctions();
        }, function (err) {
            console.error(err);
        });
    };

    $scope.editAuction = function (auction) {
        $scope.auction = angular.copy(auction);
        // ensure datetime-local-compatible format if present
        $scope.editId = auction.id;
        $scope.editMode = true;
    };

    $scope.updateAuction = function () {
        const payload = angular.copy($scope.auction);
        payload.end_time = normalizeDate(payload.end_time);
        $http.put(API_URL + $scope.editId + "/", payload).then(function () {
            $scope.cancelEdit();
            $scope.loadAuctions();
        });
    };

    $scope.cancelEdit = function () {
        $scope.auction = {};
        $scope.editId = null;
        $scope.editMode = false;
    };

    $scope.deleteAuction = function (id) {
        if (confirm("Are you sure?")) {
            $http.delete(API_URL + id + "/").then(function () {
                $scope.loadAuctions();
            });
        }
    };

    $scope.loadAuctions();
});
