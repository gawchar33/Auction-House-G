(function(angular){
  var app = angular.module('biddingApp', []);

  app.controller('BiddingController', ['$http', '$window', function($http, $window) {
    const API_URL = '/bidding/';

    var vm = this;
    vm.bid = {};
    vm.bids = [];
    vm.status = '';

    // CSRF header for Django (if needed)
    function getCookie(name){
      var value=null;
      if(document.cookie && document.cookie!==''){
        var cookies=document.cookie.split(';');
        for(var i=0;i<cookies.length;i++){var c=cookies[i].trim(); if(c.substring(0,name.length+1)===(name+'=')){value=decodeURIComponent(c.substring(name.length+1));break;}}
      }
      return value;
    }
    var csrf = getCookie('csrftoken');
    if (csrf) $http.defaults.headers.common['X-CSRFToken'] = csrf;

    // load all bids
    vm.loadBids = function() {
      vm.status = 'Loading...';
      $http.get(API_URL)
        .then(function(resp) { vm.bids = resp.data; vm.status = ''; }, function(err) { vm.status = 'Load failed'; });
    };

    // create or update
    vm.saveBid = function() {
      vm.status = vm.bid.id ? 'Updating...' : 'Creating...';
      if (vm.bid.id) {
        $http.put(API_URL + vm.bid.id + '/', vm.bid)
          .then(function() { vm.bid = {}; vm.loadBids(); vm.status=''; }, function(err) { vm.status='Update failed'; });
      } else {
        $http.post(API_URL, vm.bid)
          .then(function() { vm.bid = {}; vm.loadBids(); vm.status=''; }, function(err) { vm.status='Create failed'; });
      }
    };

    vm.editBid = function(b) {
      vm.bid = angular.copy(b);
    };

    vm.cancelEdit = function() {
      vm.bid = {};
    };

    vm.deleteBid = function(id) {
      if ($window.confirm('Delete this bid?')) {
        vm.status = 'Deleting...';
        $http.delete(API_URL + id + '/')
          .then(function() { vm.loadBids(); vm.status=''; }, function(err) { vm.status='Delete failed'; });
      }
    };

    // initial load
    vm.loadBids();
  }]);
})(window.angular);