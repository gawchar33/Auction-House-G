var app = angular.module('productApp', []);

// directive to bind file input to scope model
app.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            element.bind('change', function () {
                scope.$apply(function () {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

app.controller('ProductController', function ($scope, $http) {

    const API_URL = "http://127.0.0.1:8000/product/";

    $scope.products = [];
    $scope.product = {};
    $scope.editMode = false;
    $scope.editId = null;
    $scope.status = '';

    // CSRF for Django
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');
    if (csrftoken) $http.defaults.headers.common['X-CSRFToken'] = csrftoken;

    // helper to ensure numeric price (fixes ngModel:numfmt)
    function normalizeProductFromServer(p) {
        if (p && p.price !== undefined && p.price !== null) {
            // convert string decimal to number for number inputs
            var n = parseFloat(p.price);
            if (!isNaN(n)) p.price = n;
        }
        // if backend returns relative image path, prefix origin so <img> works
        if (p && p.image && typeof p.image === 'string' && p.image.indexOf('http') !== 0) {
            p.image = window.location.origin + p.image;
        }
        return p;
    }

    // Load products
    // Update loadProducts mapping so frontend uses image_url returned by serializer
    $scope.loadProducts = function () {
        $scope.status = 'Loading...';
        $http.get(API_URL).then(function (response) {
            $scope.products = response.data.map(function (p) {
                // prefer explicit image_url from API, fallback to image
                if (!p.image && p.image_url) p.image = p.image_url;
                // ensure price is numeric to avoid ngModel:numfmt
                if (p && p.price !== undefined && p.price !== null) {
                    var n = parseFloat(p.price);
                    if (!isNaN(n)) p.price = n;
                }
                return p;
            });
            $scope.status = '';
        }, function (err) {
            $scope.status = 'Load failed';
            console.error('Load products failed', err);
        });
    };

    // utility to append image (file or remote URL) to FormData
    function appendImageToFormData(fd, image, callback) {
        // image can be File object or a URL string
        if (!image) { callback(); return; }

        if (image instanceof File) {
            fd.append('image', image);
            callback();
            return;
        }

        // string URL -> fetch blob then append
        if (typeof image === 'string' && (image.indexOf('http://') === 0 || image.indexOf('https://') === 0)) {
            fetch(image).then(function (resp) {
                if (!resp.ok) throw new Error('Image fetch failed');
                return resp.blob();
            }).then(function (blob) {
                // derive filename from url
                var parts = image.split('/');
                var filename = parts[parts.length - 1].split('?')[0] || 'image.jpg';
                fd.append('image', blob, filename);
                callback();
            }).catch(function (err) {
                console.warn('Failed to fetch image URL, skipping image upload:', err);
                callback(); // proceed without image
            });
            return;
        }

        // otherwise skip
        callback();
    }

    function buildFormData(obj, cb) {
        var fd = new FormData();
        if (obj.name !== undefined) fd.append('name', obj.name);
        if (obj.description !== undefined) fd.append('description', obj.description);
        if (obj.price !== undefined && obj.price !== null) fd.append('price', String(obj.price));
        if (obj.stock !== undefined && obj.stock !== null) fd.append('stock', String(obj.stock));
        if (obj.category !== undefined && obj.category !== null) fd.append('category', String(obj.category));
        // image handling is async -> use appendImageToFormData then call cb(fd)
        appendImageToFormData(fd, obj.image || obj.image_url, function () {
            cb(fd);
        });
    }

    // Create product
    $scope.createProduct = function () {
        $scope.status = 'Creating...';
        buildFormData($scope.product, function (fd) {
            $http.post(API_URL, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }).then(function () {
                $scope.product = {};
                $scope.loadProducts();
                $scope.status = 'Created';
            }, function (err) {
                $scope.status = 'Create failed';
                console.error('Create product failed', err);
            });
        });
    };

    // Edit product
    $scope.editProduct = function (product) {
        // copy and ensure price is number to avoid numfmt error
        $scope.product = angular.copy(product);
        if ($scope.product.price !== undefined && $scope.product.price !== null) {
            var n = parseFloat($scope.product.price);
            if (!isNaN(n)) $scope.product.price = n;
        }
        // keep image_url if product.image is a URL
        if ($scope.product.image && typeof $scope.product.image === 'string') {
            $scope.product.image_url = $scope.product.image;
            $scope.product.image = null;
        } else {
            $scope.product.image = null; // user can upload new file
            $scope.product.image_url = '';
        }
        $scope.editId = product.id;
        $scope.editMode = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Update product
    $scope.updateProduct = function () {
        if (!$scope.editId) return;
        $scope.status = 'Updating...';
        buildFormData($scope.product, function (fd) {
            $http.put(API_URL + $scope.editId + "/", fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }).then(function () {
                $scope.cancelEdit();
                $scope.loadProducts();
                $scope.status = 'Updated';
            }, function (err) {
                $scope.status = 'Update failed';
                console.error('Update product failed', err);
            });
        });
    };

    // Cancel edit
    $scope.cancelEdit = function () {
        $scope.product = {};
        $scope.editId = null;
        $scope.editMode = false;
        $scope.status = '';
    };

    // Delete product
    $scope.deleteProduct = function (id) {
        if (confirm("Are you sure?")) {
            $scope.status = 'Deleting...';
            $http.delete(API_URL + id + "/").then(function () {
                $scope.loadProducts();
                $scope.status = 'Deleted';
            }, function (err) {
                $scope.status = 'Delete failed';
                console.error('Delete product failed', err);
            });
        }
    };

    // Initial load
    $scope.loadProducts();
});
