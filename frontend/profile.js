(function () {
  if (!window.BACKEND) window.BACKEND = 'http://127.0.0.1:8000';

  angular.module('auctionApp')
    .controller('ProfileController', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
      $scope.user = {};
      $scope.editing = false;
      $scope.saving = false;
      $scope.message = '';

      var BACKEND = (window.BACKEND || 'http://127.0.0.1:8000').replace(/\/$/, '');

      function getCookie(name){
        var value = null;
        if(document.cookie && document.cookie !== ''){
          var cookies = document.cookie.split(';');
          for(var i=0;i<cookies.length;i++){
            var c = cookies[i].trim();
            if(c.indexOf(name + '=') === 0){ value = decodeURIComponent(c.split('=')[1]); break; }
          }
        }
        return value;
      }

      function cfg(){
        var c = { withCredentials: true, headers: { 'Content-Type': 'application/json' } };
        var csrftoken = getCookie('csrftoken');
        if(csrftoken) c.headers['X-CSRFToken'] = csrftoken;
        return c;
      }
      var getEndpoints = [
        BACKEND + '/customer/me/',
        BACKEND + '/customer/',
        BACKEND + '/user/me/',
        BACKEND + '/user/'
      ];

      function tryGet(i) {
        if (i >= getEndpoints.length) {
          // All backend attempts failed — fall back to client-side stored user data
          try {
            var raw = window.localStorage.getItem('user');
            if (raw) {
              $scope.user = JSON.parse(raw) || {};
            } else {
              // try legacy local_users list
              var users = JSON.parse(window.localStorage.getItem('local_users') || '[]');
              $scope.user = (users && users.length) ? users[0] : {};
            }
            // normalize fields (same logic as when loaded from server)
            $scope.user.phone = $scope.user.phone || $scope.user.phone_number || $scope.user.mobile || '';
            $scope.user.address = $scope.user.address || $scope.user.location || $scope.user.address_line || '';

            if ($scope.user.avatar_base64 && $scope.user.avatar_base64.indexOf('data:') !== 0) {
              $scope.user.avatar_base64 = 'data:image/png;base64,' + $scope.user.avatar_base64;
            }
            if ($scope.user.avatar_base64) $scope.user.image = $scope.user.avatar_base64;

            // ensure other parts of the app know about the loaded user
            try { window.localStorage.setItem('user', JSON.stringify($scope.user)); window.dispatchEvent(new Event('user-updated')); } catch (e) {}
          } catch (e) {
            console.warn('[PROFILE] local fallback failed', e);
          }

          return;
        }
        $http.get(getEndpoints[i], cfg())
          .then(function (resp) {
            var data = resp.data;
            if (data && data.user) data = data.user;
            if (Array.isArray(data)) data = data[0] || {};
            // if we got a list from /customer/, try to pick the item belonging to current local user
            try {
              if (Array.isArray(resp.data) && resp.config && resp.config.url && resp.config.url.indexOf('/customer/') !== -1) {
                var list = resp.data || [];
                var storedRaw = window.localStorage.getItem('user') || null;
                var stored = null;
                try { stored = storedRaw ? JSON.parse(storedRaw) : null; } catch(e) { stored = null; }
                var match = null;
                if (stored) {
                  for (var ii = 0; ii < list.length; ii++) {
                    var item = list[ii] || {};
                    // item may have 'email' or nested 'user' id
                    if (item.email && stored.email && item.email === stored.email) { match = item; break; }
                    if (item.user && stored.id && String(item.user) === String(stored.id)) { match = item; break; }
                    // some serializations may embed user dict
                    if (item.user && item.user.email && stored.email && item.user.email === stored.email) { match = item; break; }
                  }
                }
                if (match) data = match; else data = list[0] || {};
              }
            } catch(e) { console.warn('[PROFILE] list selection error', e); }
            $scope.user = data || {};
            // normalize fields
            $scope.user.phone = $scope.user.phone || $scope.user.phone_number || $scope.user.mobile || '';
            $scope.user.address = $scope.user.address || $scope.user.location || $scope.user.address_line || '';

            // if backend returned raw avatar_base64, convert to data URL for preview
            if ($scope.user.avatar_base64 && $scope.user.avatar_base64.indexOf('data:') !== 0) {
              // if value is prefixed like 'username:base64', strip username prefix
              var av = $scope.user.avatar_base64 || '';
              var parts = av.indexOf(':') !== -1 ? av.split(':') : null;
              if (parts && parts.length >= 2) {
                av = parts.slice(1).join(':');
              }
              $scope.user.avatar_base64 = 'data:image/png;base64,' + av;
            }
            if ($scope.user.avatar_base64) $scope.user.image = $scope.user.avatar_base64;

            // cache successful server profile locally and notify other controllers
            try { window.localStorage.setItem('user', JSON.stringify($scope.user)); window.dispatchEvent(new Event('user-updated')); } catch (e) {}
          })
          .catch(function () {
            tryGet(i + 1);
          });
      }

      // ensure CSRF cookie is set so subsequent PATCH/POST with session auth works
      try {
        $http.get(BACKEND + '/user/csrf/', { withCredentials: true }).finally(function () { tryGet(0); });
      } catch (e) {
        // fallback: just call tryGet
        tryGet(0);
      }

      // load on open (tryGet will be called after CSRF request finishes)

      $scope.startEdit = function () {
        $scope.editing = true;
        $scope.message = '';
      };

      $scope.cancelEdit = function () {
        $scope.editing = false;
        $scope.message = '';
        // reload original data to discard changes
        tryGet(0);
      };

      $scope.onFileChange = function (input) {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (e) {
          $scope.user.image = e.target.result; // data URL for preview
          var parts = e.target.result.split(',');
          $scope.user._avatar_base64_raw = parts.length > 1 ? parts[1] : parts[0];
          var img = document.getElementById('photoPreview');
          if (img) img.src = e.target.result;
          try { $scope.$apply(); } catch (e) {}
        };
        reader.readAsDataURL(file);
      };

      // convenience wrapper: read an input file and immediately save profile
      $scope.uploadImageAndSave = function(input) {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e){
          try {
            $scope.$apply(function(){
              $scope.user.image = e.target.result;
              var parts = e.target.result.split(',');
              $scope.user._avatar_base64_raw = parts.length > 1 ? parts[1] : parts[0];
              // trigger save which will send avatar_base64 to server
              $scope.save();
            });
          } catch(err){ console.error('[PROFILE] uploadImageAndSave error', err); }
        };
        reader.readAsDataURL(file);
      };

      function trySaveTo(api, payload) {
        var c = cfg();
        return $http({
          method: 'PATCH',
          url: api,
          data: payload,
          headers: c.headers,
          withCredentials: true
        });
      }

      $scope.save = function () {
        $scope.saving = true;
        $scope.message = '';

        var payload = {
          first_name: $scope.user.first_name || '',
          last_name: $scope.user.last_name || '',
          email: $scope.user.email || '',
          phone: $scope.user.phone || '',
          address: $scope.user.address || ''
        };
        if ($scope.user._avatar_base64_raw) {
          payload.avatar_base64 = $scope.user._avatar_base64_raw; // raw base64, no data: prefix
        }

        var targets = [
          BACKEND + '/customer/me/',
          BACKEND + '/customer/',
          BACKEND + '/user/me/',
          BACKEND + '/user/'
        ];

        var i = 0;
        function next() {
          if (i >= targets.length) {
            // All server targets failed — persist changes locally as a fallback
            $scope.saving = false;
            $scope.editing = false;
            try {
              // Merge current form values into existing stored user (if any)
              var existing = JSON.parse(window.localStorage.getItem('user') || 'null');
              var toSave = existing && typeof existing === 'object' ? Object.assign({}, existing, $scope.user) : $scope.user || {};
              // attach raw base64 if present
              if ($scope.user._avatar_base64_raw) toSave.avatar_base64 = $scope.user._avatar_base64_raw;

              window.localStorage.setItem('user', JSON.stringify(toSave));

              // also keep local_users list up-to-date for fallback login/signup flows
              try {
                var users = JSON.parse(window.localStorage.getItem('local_users') || '[]');
                var found = false;
                for (var k = 0; k < users.length; k++) {
                  if (users[k] && users[k].email && toSave.email && users[k].email === toSave.email) {
                    users[k] = toSave; found = true; break;
                  }
                }
                if (!found) users.push(toSave);
                window.localStorage.setItem('local_users', JSON.stringify(users));
              } catch (e) { /* ignore local_users errors */ }

              // notify other controllers (NavController listens for this)
              try { window.dispatchEvent(new Event('user-updated')); } catch (e) {}
              $scope.message = 'Saved locally (offline)';
            } catch (e) {
              console.error('[PROFILE] local save failed', e);
              $scope.message = 'Save failed';
            }
            return;
          }
          var api = targets[i++];
          trySaveTo(api, payload)
            .then(function (resp) {
              $scope.saving = false;
              $scope.editing = false;
              $scope.message = 'Profile updated';
              if (resp && resp.data) {
                var d = resp.data;
                if (d && d.user) d = d.user;
                if (Array.isArray(d)) d = d[0] || d;
                $scope.user = d || $scope.user;
                if ($scope.user.avatar_base64 && $scope.user.avatar_base64.indexOf('data:') !== 0) {
                  $scope.user.avatar_base64 = 'data:image/png;base64,' + $scope.user.avatar_base64;
                }
                if ($scope.user.avatar_base64) $scope.user.image = $scope.user.avatar_base64;
              }
              // notify navbar/other controllers
              try {
                // keep angular event for compatibility
                $rootScope.$broadcast('user:updated', $scope.user);
              } catch (e) {}
              try {
                // persist to localStorage and dispatch global event used by NavController
                // prefer authoritative server profile: fetch /user/profile/ and cache that
                $http.get(BACKEND + '/user/profile/', { withCredentials: true })
                  .then(function(profileResp){
                    var prof = profileResp.data || {};
                    // ensure any avatar prefix handling
                    try {
                      if (prof && prof.customer && prof.customer.avatar_base64) {
                        var av = prof.customer.avatar_base64;
                        if (av && av.indexOf(':') !== -1) av = av.split(':',1).length>1?av.split(':')[1]:av;
                        prof.avatar_base64 = 'data:image/png;base64,' + av;
                      }
                    } catch(e){}
                    window.localStorage.setItem('user', JSON.stringify(prof));
                    window.dispatchEvent(new Event('user-updated'));
                    $scope.user = prof;
                  })
                  .catch(function(){
                    // fallback to storing the client-side user if profile fetch fails
                    window.localStorage.setItem('user', JSON.stringify($scope.user));
                    window.dispatchEvent(new Event('user-updated'));
                  });
               } catch (e) {}
            })
            .catch(function (err) {
              // handle permission/CSRF errors explicitly
              if (err && err.status === 403) {
                console.warn('[PROFILE] PATCH returned 403, verifying session...', err);
                // first verify if session is still valid by requesting /user/profile/
                $http.get(BACKEND + '/user/profile/', { withCredentials: true })
                  .then(function(profileResp){
                    // profile returned -> user is authenticated, this is likely a CSRF token issue
                    console.log('[PROFILE] session valid but PATCH was forbidden — refreshing CSRF and retrying');
                    $scope.message = 'Session active but token missing. Refreshing and retrying...';
                    // refresh CSRF then retry
                    $http.get(BACKEND + '/user/csrf/', { withCredentials: true })
                      .then(function(){
                        // reset any retry marker and retry save sequence
                        $scope._csrfRetry = ($scope._csrfRetry || 0) + 1;
                        if ($scope._csrfRetry <= 2) {
                          next();
                        } else {
                          $scope.saving = false;
                          $scope.message = 'Unable to save. Please try again.';
                        }
                      })
                      .catch(function(csrfErr){
                        console.error('[PROFILE] CSRF refresh failed', csrfErr);
                        $scope.saving = false;
                        $scope.message = 'Unable to refresh token. Please login and try again.';
                        $scope.requireLogin = true;
                      });
                  })
                  .catch(function(profileErr){
                    // profile GET failed -> user is unauthenticated
                    console.warn('[PROFILE] session appears expired', profileErr);
                    $scope.saving = false;
                    $scope.message = 'Session expired. Please login to save your profile.';
                    $scope.requireLogin = true;
                    // do not auto-redirect — let the user decide
                  });
                return;
              }
              next();
            });
        }

        next();
      };
    }]);
})();
