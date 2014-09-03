var dropbox = angular.module('dropbox', []);

// 'basename' filter: get filename from full path
dropbox.filter('basename', function() {
    return function(path) {
        return path.substr(path.lastIndexOf('/') + 1);
    };
});

dropbox.factory('DropboxService', function($http) {
    var baseUrl = '/dropbox';
    
    return {
        getStatus: function(id) {
            return $http.get(baseUrl+'/status');
        },
        requestAuthorization: function(id) {
            return $http.get(baseUrl+'/authorize');
        },
        finishAuthorization: function(authCode) {
            return $http.post(baseUrl+'/authorize', {
                'authorization_code': authCode
            });
        },
        getMetadata: function(path) {
            return $http.get(baseUrl+'/metadata', {
                params : {
                    'path': path
                }
            });
        }
    };
});

dropbox.controller('DropboxAuthCtrl', function($scope, $modal, DropboxService) {
    // Get Dropbox status
    DropboxService.getStatus()
        .success(function(status) {
            $scope.status = status;
        });

    $scope.openAuthDialog = function() {
        var modal = $modal.open({
            templateUrl: partial('dropbox/auth-dialog.html'),
            controller: function($scope, $modalInstance, DropboxService) {
                // Get authorization URL
                DropboxService.requestAuthorization()
                    .success(function(data) {
                        $scope.authUrl = data.authorize_url;
                    });
                    
                $scope.codeChanged = function(form) {
                    // Reset invalidCode flag when code changes
                    form.code.$setValidity('invalidCode', true);
                };
                
                $scope.ok = function(form) {
                    // Finish authorization
                    DropboxService.finishAuthorization(form.authCode)
                        .success(function(data) {
                            // Auth successful
                            $modalInstance.close(true);
                        })
                        .error(function(data, status) {
                            // Invalid auth code
                            if(status == 400) {
                                form.code.$setValidity('invalidCode', false);
                            }
                        });
                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            }
        });
        
        modal.result.then(function(authorized) {
            // Refresh Dropbox status
            DropboxService.getStatus()
                .success(function(status) {
                    $scope.status = status;
                });
        });
    };
});
