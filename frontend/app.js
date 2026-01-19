/* core frontend module and controllers */
console.log('app.js loaded — ' + new Date().toISOString());
window.BACKEND = window.BACKEND || 'http://127.0.0.1:8000';

angular.module('auctionApp', [])
.config(['$httpProvider', function($httpProvider){
  $httpProvider.defaults.withCredentials = true;
}])
.run(['$http', function($http){
  // request CSRF cookie
  $http.get(window.BACKEND + '/user/csrf/', { withCredentials: true }).catch(function(){});
}])

.controller('NavController', ['$scope','$http', function($scope,$http){
  $scope.isAuthenticated = !!window.localStorage.getItem('auth');
  $scope.user = {};
  $scope.toggleMenu = false;

  $scope.loadUser = function(){
    if(!$scope.isAuthenticated) return;
    $http.get(window.BACKEND + '/user/profile/', { withCredentials: true })
      .then(function(resp){ $scope.user = resp.data || {}; })
      .catch(function(){ $scope.user = {}; });
  };

  $scope.logout = function(){
    $http.post(window.BACKEND + '/user/logout/', {}, { withCredentials: true })
      .finally(function(){
        window.localStorage.removeItem('auth');
        $scope.isAuthenticated = false;
        $scope.user = {};
        window.location.href = 'index.html';
      });
  };

  $scope.loadUser();
}])

.controller('HomeController', ['$scope', function($scope){
  $scope.year = new Date().getFullYear();
  $scope.categories = [
    {slug:'electronics', title:'Electronics', desc:'Phones, laptops and cameras', icon:'📱'},
    {slug:'vehicles', title:'Vehicles', desc:'Cars, bikes and parts', icon:'🚗'},
    {slug:'fashion', title:'Fashion', desc:'Apparel & accessories', icon:'👗'}
  ];
  $scope.featured = [
    {name:'Vintage Camera', image:'https://picsum.photos/seed/cam/900/600', base:90.00, current:125.00, time_remaining:'2d 4h'},
    {name:'Classic Motorbike', image:'https://picsum.photos/seed/bike/900/600', base:600.00, current:820.00, time_remaining:'12h 20m'},
    {name:'Leather Jacket', image:'https://picsum.photos/seed/jkt/900/600', base:25.00, current:45.00, time_remaining:'5h 2m'},
    {name:'Smartphone X', image:'https://picsum.photos/seed/phone/900/600', base:350.00, current:410.00, time_remaining:'1d 3h'}
  ];
  $scope.placeBid = function(p){ alert('Bid flow not implemented — selected: ' + p.name); };
}])

.controller('AuthController', ['$scope','$http','$window', function($scope,$http,$window){
  console.log('AuthController init');
  $scope.form = {};
  $scope.message = '';
  $scope.loading = false;

  function getCookie(name){
    var value = null;
    if(document.cookie && document.cookie !== ''){
      var cookies = document.cookie.split(';');
      for(var i=0;i<cookies.length;i++){
        var c = cookies[i].trim();
        if(c.indexOf(name+'=')===0){ value = decodeURIComponent(c.split('=')[1]); break; }
      }
    }
    return value;
  }

  function jsonCfg(){
    var csrftoken = getCookie('csrftoken');
    var cfg = { withCredentials: true, headers: {'Content-Type':'application/json'} };
    if(csrftoken) cfg.headers['X-CSRFToken'] = csrftoken;
    return cfg;
  }

  $scope.signup = function(){
    $scope.message = '';
    if(!$scope.form.password){ $scope.message='Password required'; return; }
    $scope.loading = true;
    var payload = { name: ($scope.form.first_name || '') + ( $scope.form.last_name ? ' '+$scope.form.last_name:''),
                    email: $scope.form.email, password: $scope.form.password };
    $http.post(window.BACKEND + '/user/signup/', payload, jsonCfg())
      .then(function(resp){
        $scope.loading = false;
        $scope.message = 'Signup successful. Redirecting to login...';
        setTimeout(function(){ window.location.href = 'login.html'; }, 700);
      })
      .catch(function(err){
        $scope.loading = false;
        $scope.message = (err.data && (err.data.detail || err.data.error)) || 'Signup failed';
      });
  };

  $scope.login = function(){
    $scope.message = '';
    $scope.loading = true;
    var payload = { email: $scope.form.email, password: $scope.form.password };
    $http.post(window.BACKEND + '/user/login/', payload, jsonCfg())
      .then(function(resp){
        $scope.loading = false;
        $scope.message = 'Login successful. Redirecting...';
        window.localStorage.setItem('auth','1');
        setTimeout(function(){ window.location.href = 'index.html'; }, 600);
      })
      .catch(function(err){
        $scope.loading = false;
        $scope.message = (err.data && (err.data.detail || err.data.error)) || 'Invalid credentials';
      });
  };
}])

.controller('ProfileController', ['$scope','$http', function($scope,$http){
  $scope.profile = {};
  $scope.error = '';
  var BACKEND = window.BACKEND || 'http://127.0.0.1:8000';

  $scope.loadProfile = function(){
    $http.get(BACKEND + '/user/profile/', { withCredentials: true })
      .then(function(resp){ $scope.profile = resp.data; })
      .catch(function(err){ $scope.error = 'Could not load profile'; });
  };

  $scope.logout = function(){
    $http.post(BACKEND + '/user/logout/', {}, { withCredentials: true }).finally(function(){
      window.localStorage.removeItem('auth');
      window.location.replace(window.location.origin + (window.location.origin.indexOf('5500') !== -1 ? '/frontend/index.html' : '/index.html'));
    });
  };

  $scope.loadProfile();
}]);
