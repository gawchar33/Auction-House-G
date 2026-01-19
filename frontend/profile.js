(function () {
  if (!window.BACKEND) window.BACKEND = 'http://127.0.0.1:8000';

  angular.module('auctionApp')
    .controller('ProfileController', ['$scope', '$http', '$window', function ($scope, $http, $window) {
      $scope.edit = false;
      $scope.form = { name: '', email: '', phone: '', address: '' };
      $scope.preview = '';
      $scope.saving = false;
      $scope.message = '';
      $scope.messageType = '';

      $scope.defaultAvatar = 'data:image/svg+xml;utf8,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" fill="none">' +
        '<rect width="100%" height="100%" rx="12" fill="#f3f7fb"/>' +
        '<g transform="translate(4 3)" fill="#9aaedb">' +
        '<circle cx="8" cy="6" r="4"/>' +
        '<path d="M0 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#9aaedb" stroke-width="1.5" fill="none"/>' +
        '</g></svg>'
      );

      function getCookie(name) {
        var value = null;
        if (document.cookie && document.cookie !== '') {
          var cookies = document.cookie.split(';');
          for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i].trim();
            if (c.indexOf(name + '=') === 0) { value = decodeURIComponent(c.split('=')[1]); break; }
          }
        }
        return value;
      }

      function profileEndpoints() {
        var uid = window.localStorage.getItem('user_id');
        return {
          userUrl: window.BACKEND + '/user/profile/',
          authUrl: uid ? (window.BACKEND + '/auth/profile/' + uid + '/') : null
        };
      }

      function applyDataToForm(data) {
        var first = data.first_name || data.first || '';
        var last = data.last_name || data.last || '';
        $scope.form.name = ((first || '') + (last ? (' ' + last) : '')).trim() || (data.username || '');
        $scope.form.email = data.email || '';
        $scope.form.phone = data.phone || (data.customer && data.customer.phone) || '';
        $scope.form.address = data.address || '';
        $scope.preview = data.profile_photo || data.photo || $scope.defaultAvatar;
        try { window.localStorage.setItem('user', JSON.stringify(data)); if (data.id) window.localStorage.setItem('user_id', String(data.id)); } catch (e) {}
      }

      // load from server then fallback to cached signup data
      $scope.load = function () {
        var ep = profileEndpoints();
        $scope.message = ''; $scope.messageType = '';
        $http.get(ep.userUrl, { withCredentials: true })
          .then(function (r) { applyDataToForm(r.data || {}); })
          .catch(function () {
            if (ep.authUrl) {
              $http.get(ep.authUrl, { withCredentials: true })
                .then(function (r2) { applyDataToForm(r2.data || {}); })
                .catch(function () {
                  // fallback to local cache (signup)
                  try {
                    var cached = JSON.parse(window.localStorage.getItem('user') || '{}');
                    if (Object.keys(cached).length) {
                      applyDataToForm(cached);
                      return;
                    }
                  } catch (e) {}
                  $scope.message = 'Failed to load profile';
                  $scope.messageType = 'error';
                });
            } else {
              // no auth endpoint, fallback to local cache
              try {
                var cached2 = JSON.parse(window.localStorage.getItem('user') || '{}');
                if (Object.keys(cached2).length) {
                  applyDataToForm(cached2);
                  return;
                }
              } catch (e) {}
              $scope.message = 'Please login to edit profile';
              $scope.messageType = 'error';
              $window.location.href = 'login.html';
            }
          });
      };

      $scope.toggleEdit = function () {
        $scope.edit = !$scope.edit;
        $scope.message = '';
      };

      $scope.onFileChange = function (files) {
        if (!files || !files[0]) return;
        $scope.$apply(function () {
          $scope.selectedFile = files[0];
          var reader = new FileReader();
          reader.onload = function (e) {
            $scope.$apply(function () { $scope.preview = e.target.result; });
          };
          reader.readAsDataURL(files[0]);
        });
      };

      // Save and update visible profile immediately (optimistic update + cache)
      $scope.save = function (event) {
        if (event && event.preventDefault) event.preventDefault();
        $scope.saving = true; $scope.message = ''; $scope.messageType = '';

        var ep = profileEndpoints();
        var full = ($scope.form.name || '').trim();
        var first = full.split(' ')[0] || '';
        var last = full.indexOf(' ') > -1 ? full.split(' ').slice(1).join(' ') : '';

        var fd = new FormData();
        fd.append('first_name', first);
        if (last) fd.append('last_name', last);
        fd.append('email', $scope.form.email || '');
        if ($scope.form.phone) fd.append('phone', $scope.form.phone);
        if ($scope.form.address) fd.append('address', $scope.form.address);
        if ($scope.selectedFile) fd.append('photo', $scope.selectedFile);

        var csrftoken = getCookie('csrftoken');
        var headers = {};
        if (csrftoken) headers['X-CSRFToken'] = csrftoken;

        function doRequest(method, url) {
          var cfg = { method: method, url: url, data: fd, withCredentials: true, headers: angular.extend({}, headers) };
          cfg.transformRequest = angular.identity;
          cfg.headers['Content-Type'] = undefined;
          return $http(cfg);
        }

        // try sensible sequence; UI will update immediately on success or optimistic fallback saved to localStorage
        var attempts = [];
        if (ep.userUrl) attempts.push({ m: 'PATCH', u: ep.userUrl });
        if (ep.authUrl) attempts.push({ m: 'PATCH', u: ep.authUrl });
        if (ep.authUrl) attempts.push({ m: 'PUT', u: ep.authUrl });

        var i = 0;
        function next() {
          if (i >= attempts.length) {
            // none worked — persist locally and reflect changes in UI
            try {
              var localSave = {
                first_name: first,
                last_name: last,
                email: $scope.form.email,
                phone: $scope.form.phone,
                address: $scope.form.address,
                profile_photo: $scope.preview || $scope.defaultAvatar
              };
              applyDataToForm(localSave);
              window.localStorage.setItem('user', JSON.stringify(localSave));
            } catch (e) {}
            $scope.saving = false;
            $scope.edit = false;
            $scope.message = 'Profile saved locally (server did not accept update).';
            $scope.messageType = 'success';
            return;
          }
          var a = attempts[i++];
          doRequest(a.m, a.u)
            .then(function (resp) {
              var data = resp.data || {};
              if (Object.keys(data).length) {
                applyDataToForm(data);
                try {
                  window.localStorage.setItem('user', JSON.stringify(data || {
                    first_name: first, last_name: last, email: $scope.form.email, phone: $scope.form.phone, address: $scope.form.address, profile_photo: $scope.preview || $scope.defaultAvatar
                  }));
                  // notify other controllers in same tab
                  window.dispatchEvent(new Event('user-updated'));
                } catch (e) {}
              } else {
                // server returned no body — reflect submitted values locally
                try {
                  var cached = {
                    first_name: first,
                    last_name: last,
                    email: $scope.form.email,
                    phone: $scope.form.phone,
                    address: $scope.form.address,
                    profile_photo: $scope.preview || $scope.defaultAvatar
                  };
                  applyDataToForm(cached);
                  window.localStorage.setItem('user', JSON.stringify(cached));
                } catch (e) {}
              }
              $scope.saving = false;
              $scope.edit = false;
              $scope.message = 'Profile saved';
              $scope.messageType = 'success';
            })
            .catch(function (err) {
              console.warn('[PROFILE] save attempt failed', a.m, a.u, err.status);
              if (err.status === 405 || err.status === 404 || err.status === 400) {
                next();
              } else {
                $scope.saving = false;
                $scope.message = (err.data && (err.data.detail || err.data.error)) || ('Save failed (' + (err.status || 'err') + ')');
                $scope.messageType = 'error';
              }
            });
        }
        next();
      };

      $scope.load();
    }]);
})();
