function signup() {
  var usernameEl = document.getElementById('su-username');
  var emailEl = document.getElementById('su-email');
  var passwordEl = document.getElementById('su-password');
  var confirmEl = document.getElementById('su-confirm');

  var username = usernameEl ? usernameEl.value.trim() : '';
  var email = emailEl ? emailEl.value.trim() : '';
  var password = passwordEl ? passwordEl.value : '';
  var confirm = confirmEl ? confirmEl.value : '';

  if (!username || !email || !password) { alert('Please fill all fields'); return false; }
  if (password.length < 6) { alert('Password must be at least 6 characters'); return false; }
  if (confirmEl && password !== confirm) { alert('Password and confirm password do not match'); return false; }

  try {
    var user = { username: username, email: email, password: password };
    window.localStorage.setItem('user', JSON.stringify(user));
    console.log('[AUTH] signup saved locally', user);
  } catch (e) {
    console.error('[AUTH] signup storage error', e);
    alert('Unable to save signup data locally');
    return false;
  }

  // redirect to login page (use replace so users don't go back to the signup submit)
  try { window.location.replace('login.html'); } catch (e) { window.location.href = 'login.html'; }
  return false;
}

function login() {
  var usernameEl = document.getElementById('li-username');
  var emailEl = document.getElementById('li-email');
  var passwordEl = document.getElementById('li-password');

  var identifier = '';
  if (usernameEl && usernameEl.value.trim()) identifier = usernameEl.value.trim();
  else if (emailEl && emailEl.value.trim()) identifier = emailEl.value.trim();

  var password = passwordEl ? passwordEl.value : '';

  if (!identifier || !password) { alert('Enter username/email and password'); return false; }

  try {
    var stored = JSON.parse(window.localStorage.getItem('user') || 'null');
    if (!stored || (stored.username !== identifier && stored.email !== identifier) || stored.password !== password) {
      alert('Invalid username/email or password');
      return false;
    }

    window.localStorage.setItem('loggedIn', 'true');
    window.localStorage.setItem('user', JSON.stringify(stored));
    if (stored.id) window.localStorage.setItem('user_id', String(stored.id));
    console.log('[AUTH] login success', stored);

    try { window.location.replace('index.html'); } catch (e) { window.location.href = 'index.html'; }
    return false;
  } catch (e) {
    console.error('[AUTH] login error', e);
    alert('Login failed');
    return false;
  }
}

function logout() {
  window.localStorage.removeItem('loggedIn');
  window.location.href = 'login.html';
}

function checkLogin() {
  if (window.localStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'login.html';
  }
}

/* auth controller: signup, login; expects app.js loaded and window.BACKEND set */
(function(){
  if(!window.BACKEND) window.BACKEND = 'http://127.0.0.1:8000';

  var app = angular.module('auctionApp');

  app.controller('AuthController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.form = $scope.form || {};
    $scope.loading = false;
    $scope.message = '';
    $scope.messageType = '';

    function jsonCfg() {
      return { headers: { 'Content-Type': 'application/json' }, withCredentials: true };
    }

    function saveLocalUser(user) {
      try {
        var users = JSON.parse(window.localStorage.getItem('local_users') || '[]');
        users = users.filter(function (u) {
          return !((u.email && user.email && u.email === user.email) || (u.username && user.username && u.username === user.username));
        });
        users.push(user);
        window.localStorage.setItem('local_users', JSON.stringify(users));
      } catch (e) { console.error('[AUTH] saveLocalUser error', e); }
    }

    function findLocalUser(identifier) {
      try {
        var users = JSON.parse(window.localStorage.getItem('local_users') || '[]');
        for (var i = 0; i < users.length; i++) {
          var u = users[i];
          if ((u.email && u.email === identifier) || (u.username && u.username === identifier)) return u;
        }
      } catch (e) { console.error('[AUTH] findLocalUser error', e); }
      return null;
    }

    $scope.signup = function (event) {
      if (event && event.preventDefault) event.preventDefault();
      $scope.loading = true; $scope.message = ''; $scope.messageType = '';

      var name = ($scope.form.name || '').trim();
      var email = ($scope.form.email || '').trim();
      var password = $scope.form.password || '';
      var confirm = $scope.form.confirm || '';

      if (!name || !email || !password) {
        $scope.message = 'Name, email and password are required';
        $scope.messageType = 'error';
        $scope.loading = false;
        return;
      }
      if (password.length < 6) {
        $scope.message = 'Password must be at least 6 characters';
        $scope.messageType = 'error';
        $scope.loading = false;
        return;
      }
      if (password !== confirm) {
        $scope.message = 'Password and confirm password do not match';
        $scope.messageType = 'error';
        $scope.loading = false;
        return;
      }

      var payload = { username: name, email: email, password: password };

      // Try backend first, fall back to local storage
      $http.post((window.BACKEND || 'http://127.0.0.1:8000') + '/user/signup/', payload, jsonCfg())
        .then(function (resp) {
          try {
            var saved = resp.data && Object.keys(resp.data).length ? resp.data : payload;
            saveLocalUser(saved);
            if (saved.id) window.localStorage.setItem('user_id', String(saved.id));
          } catch (e) { console.error('[AUTH] signup save error', e); }
          $scope.loading = false;
          $scope.message = 'Signup successful. Redirecting to login...';
          $scope.messageType = 'success';
          setTimeout(function () { try { $window.location.replace('login.html'); } catch (e) { window.location.href = 'login.html'; } }, 700);
        })
        .catch(function (err) {
          console.warn('[AUTH] signup failed, saving locally', err && (err.status || err.message));
          // store locally so multiple signups are preserved
          try { saveLocalUser(payload); } catch (e) { console.error('[AUTH] local save error', e); }
          $scope.loading = false;
          $scope.message = 'Signup saved locally. Redirecting to login...';
          $scope.messageType = 'success';
          setTimeout(function () { try { $window.location.replace('login.html'); } catch (e) { window.location.href = 'login.html'; } }, 700);
        });
    };

    $scope.login = function (event) {
      if (event && event.preventDefault) event.preventDefault();
      $scope.loading = true; $scope.message = ''; $scope.messageType = '';

      var identifier = ($scope.form.email || '').trim();
      var password = $scope.form.password || '';

      if (!identifier || !password) {
        $scope.message = 'Email/username and password required';
        $scope.messageType = 'error';
        $scope.loading = false;
        return;
      }

      var payload = { email: identifier, password: password };

      // Try backend login first
      $http.post((window.BACKEND || 'http://127.0.0.1:8000') + '/user/login/', payload, jsonCfg())
        .then(function (resp) {
          $scope.loading = false;
          try {
            var userToStore = (resp.data && Object.keys(resp.data).length) ? resp.data : payload;
            window.localStorage.setItem('auth', '1');
            window.localStorage.setItem('user', JSON.stringify(userToStore));
            if (userToStore.id) window.localStorage.setItem('user_id', String(userToStore.id));
            // notify other controllers/pages
            try { window.dispatchEvent(new Event('user-updated')); } catch (e) {}
          } catch (e) { console.error('[AUTH] login save error', e); }
          $scope.message = 'Login successful. Redirecting...';
          $scope.messageType = 'success';
          try { $window.location.replace('index.html'); } catch (e) { window.location.href = 'index.html'; }
        })
        .catch(function (err) {
          console.warn('[AUTH] login failed, trying local users', err && (err.status || err.message));
          // fallback: check local_users list
          var local = findLocalUser(identifier);
          if (local && local.password === password) {
            try {
              window.localStorage.setItem('auth', '1');
              window.localStorage.setItem('user', JSON.stringify(local));
              if (local.id) window.localStorage.setItem('user_id', String(local.id));
              try { window.dispatchEvent(new Event('user-updated')); } catch (e) {}
            } catch (e) { console.error('[AUTH] local login save error', e); }
            $scope.loading = false;
            $scope.message = 'Login successful (local). Redirecting...';
            $scope.messageType = 'success';
            try { $window.location.replace('index.html'); } catch (e) { window.location.href = 'index.html'; }
            return;
          }

          $scope.loading = false;
          $scope.messageType = 'error';
          $scope.message = (err.data && (err.data.error || err.data.detail)) || 'Invalid credentials';
        });
    };

    // expose global wrappers for legacy forms (keeps onsubmit handlers working)
    try {
      window.signup = function () { try { return (typeof $scope.signup === 'function') ? $scope.signup() : false; } catch (e) { console.error('[AUTH] global signup wrapper error', e); return false; } };
      window.login = function () { try { return (typeof $scope.login === 'function') ? $scope.login() : false; } catch (e) { console.error('[AUTH] global login wrapper error', e); return false; } };
    } catch (e) { console.error('[AUTH] expose globals failed', e); }
  }]);

  // NavController: check localStorage auth first and refresh profile
  app.controller('NavController', ['$scope','$http','$window','$document', function($scope,$http,$window,$document){
    $scope.navOpen = false;
    $scope.userMenu = false;
    $scope.isAuthenticated = false;
    $scope.user = {};

    // read cached user on init so Govind shows up immediately after local login/signup
    try {
      var cached = JSON.parse(window.localStorage.getItem('user') || '{}');
      if (cached && Object.keys(cached).length) {
        $scope.user = cached;
        $scope.isAuthenticated = (window.localStorage.getItem('auth') === '1') || true;
      }
    } catch (e) { console.warn('[NAV] read cached user failed', e); }

    // listen for explicit user updates dispatched by profile/auth flows
    window.addEventListener('user-updated', function(){
      try{
        var u = JSON.parse(window.localStorage.getItem('user') || '{}');
        if(u && Object.keys(u).length){
          try{ $scope.$apply(function(){ $scope.user = u; $scope.isAuthenticated = true; }); }catch(e){ $scope.user = u; $scope.isAuthenticated = true; }
        }
      }catch(e){}
    });

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

    function cfg(){
      var cfg = { withCredentials: true, headers: {} };
      var csrftoken = getCookie('csrftoken');
      if(csrftoken) cfg.headers['X-CSRFToken'] = csrftoken;
      return cfg;
    }

    // load any cached user so UI updates immediately
    function loadCached(){
      try{
        var u = window.localStorage && window.localStorage.getItem('user');
        var a = window.localStorage && window.localStorage.getItem('auth');
        if(a) $scope.isAuthenticated = true;
        if(u) $scope.user = JSON.parse(u);
      }catch(e){}
    }

    $scope.init = function(){
      loadCached();

      // fetch server profile (reliable source of truth)
      $http.get(window.BACKEND + '/user/profile/', cfg())
        .then(function(resp){
          $scope.user = resp.data || {};
          $scope.isAuthenticated = true;
          // cache client-side so navbar shows immediately after login
          try{
            window.localStorage.setItem('auth','1');
            window.localStorage.setItem('user', JSON.stringify($scope.user));
            if($scope.user.id) window.localStorage.setItem('user_id', String($scope.user.id));
          }catch(e){}
        })
        .catch(function(err){
          // if server says unauthenticated, clear cached state
          $scope.user = {};
          $scope.isAuthenticated = false;
          try{ window.localStorage.removeItem('auth'); window.localStorage.removeItem('user'); window.localStorage.removeItem('user_id'); }catch(e){}
        });

      // close dropdown on outside click
      angular.element(document).on('click.nav', function(){
        if(!$scope.$$phase) $scope.$apply(function(){ $scope.userMenu = false; });
      });
    };

    $scope.toggleUserMenu = function(ev){
      if(ev){ ev.stopPropagation(); ev.preventDefault && ev.preventDefault(); }
      $scope.userMenu = !$scope.userMenu;
    };

    $scope.goProfile = function(ev){
      if(ev && ev.preventDefault) ev.preventDefault();

      // Always verify server session before navigation
      $http.get(window.BACKEND + '/user/profile/', cfg())
        .then(function(resp){
          $scope.user = resp.data || {};
          $scope.isAuthenticated = true;
          try{ window.localStorage.setItem('auth','1'); window.localStorage.setItem('user', JSON.stringify($scope.user)); if($scope.user.id) window.localStorage.setItem('user_id', String($scope.user.id)); }catch(e){}
          $window.location.href = 'profile.html';
        })
        .catch(function(){
          try{ window.localStorage.removeItem('auth'); window.localStorage.removeItem('user'); window.localStorage.removeItem('user_id'); }catch(e){}
          $window.location.href = 'login.html';
        });
    };

    $scope.logout = function(){
      $http.post(window.BACKEND + '/user/logout/', {}, cfg())
        .then(function(){
          $scope.isAuthenticated = false;
          $scope.user = {};
          try{ window.localStorage.removeItem('auth'); window.localStorage.removeItem('user'); window.localStorage.removeItem('user_id'); }catch(e){}
          $window.location.replace('index.html');
        })
        .catch(function(){
          $scope.isAuthenticated = false;
          $scope.user = {};
          try{ window.localStorage.removeItem('auth'); window.localStorage.removeItem('user'); window.localStorage.removeItem('user_id'); }catch(e){}
          $window.location.replace('index.html');
        });
    };

    // expose avatar helpers so index.html can call them
    $scope.triggerAvatarInput = function(ev){
      if(ev){ ev.stopPropagation(); ev.preventDefault && ev.preventDefault(); }
      var el = document.getElementById('nav-avatar-input');
      if(el) el.click();
    };

    $scope.onAvatarChange = function(files){
      if(!files || !files[0]) return;
      var f = files[0];
      var reader = new FileReader();
      reader.onload = function(e){
        try{
          $scope.$apply(function(){
            // update nav immediately with dataURL preview
            $scope.user = $scope.user || {};
            $scope.user.profile_photo = e.target.result;
            // persist to local cache so profile page sees it
            try{ window.localStorage.setItem('user', JSON.stringify($scope.user)); }catch(e){}
          });
        }catch(err){ console.error('[NAV] avatar apply error', err); }
      };
      reader.readAsDataURL(f);
    };

    // listen for localStorage changes (profile edits from profile page) and update nav
    window.addEventListener('storage', function(ev){
      if(ev.key === 'user'){
        try{
          var u = JSON.parse(ev.newValue || '{}');
          if(u && Object.keys(u).length){
            // apply in angular digest
            var scope = angular.element(document.querySelector('[ng-controller="NavController"]')).scope();
            if(scope){
              scope.$apply(function(){ scope.user = u; scope.isAuthenticated = true; });
            }
          }
        }catch(e){}
      }
    });

    // update nav when profile page saves changes
    window.addEventListener('user-updated', function(){
      try{
        var u = JSON.parse(window.localStorage.getItem('user') || '{}');
        if(u && Object.keys(u).length){
          // ensure run inside Angular digest
          try{ $scope.$apply(function(){ $scope.user = u; $scope.isAuthenticated = true; }); }catch(e){ $scope.user = u; $scope.isAuthenticated = true; }
        }
      }catch(e){}
    });

    $scope.init();
  }]);

  angular.module('auctionApp').controller('NavController', ['$scope', '$http', '$window', function($scope, $http, $window) {
    $scope.navOpen = false;
    $scope.userMenu = false;
    $scope.isAuthenticated = false;
    $scope.user = {};

    function loadFromStorage() {
      try {
        var auth = window.localStorage.getItem('auth');
        var raw = window.localStorage.getItem('user') || '{}';
        var u = {};
        try { u = JSON.parse(raw || '{}'); } catch(e) { u = {}; }
        // treat presence of auth flag or a populated user as signed-in
        var signed = (auth === '1' || auth === 'true') || (u && Object.keys(u).length > 0);
        $scope.user = u && Object.keys(u).length ? u : {};
        $scope.isAuthenticated = !!signed;
        // ensure Angular digest if needed
        try { if(!$scope.$$phase) $scope.$apply(); } catch(e) {}
      } catch (e) {
        console.warn('[NAV] loadFromStorage failed', e);
      }
    }

    // initial load from localStorage
    loadFromStorage();

    // toggle menu helper
    $scope.toggleUserMenu = function (ev) {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      $scope.userMenu = !$scope.userMenu;
    };

    $scope.goProfile = function () {
      $scope.userMenu = false;
      $window.location.href = 'profile.html';
    };

    $scope.logout = function () {
      try { window.localStorage.removeItem('auth'); } catch(e){}
      try { window.localStorage.removeItem('user'); } catch(e){}
      $scope.isAuthenticated = false;
      $scope.user = {};
      try { $scope.$apply(); } catch(e){}
      $window.location.href = 'login.html';
    };

    // react to explicit app-level update (profile/login code dispatches this)
    window.addEventListener('user-updated', function () {
      try { loadFromStorage(); } catch (e) { console.warn('[NAV] user-updated handler error', e); }
    });

    // react to storage events (other tabs or some calls may update storage)
    window.addEventListener('storage', function (ev) {
      if (!ev) return;
      if (ev.key === 'user' || ev.key === 'auth' || ev.key === 'local_users') {
        try { loadFromStorage(); } catch (e) { console.warn('[NAV] storage event handler error', e); }
      }
    });

    // defensive: expose a refresh helper used during debugging
    $scope.refreshUser = function () { loadFromStorage(); };
  }]);
})();
