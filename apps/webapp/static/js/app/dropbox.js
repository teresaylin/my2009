var dropbox = angular.module('dropbox', []);

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
        },
        addDropboxFiles: function(dirFileId, files) {
            return $http.post(baseUrl+'/add-dropbox-files', {
                'dir_file_id': dirFileId,
                'files': files
            });
        }
    };
});

dropbox.factory('DropboxUploadService', function($modal, DropboxService) {
    return {
        openUploadDialog: function(dirFileId) {
            var modal = $modal.open({
                backdrop: 'static',
                templateUrl: partial('dropbox/upload-dialog.html'),
                controller: function($scope, $modalInstance, DropboxService) {
                    // Set current path
                    $scope.setPath = function(path) {
                        $scope.path = path;
                        $scope.numFilesSelected = 0;

                        // Retrieve metadata
                        DropboxService.getMetadata($scope.path)
                            .success(function(data) {
                                $scope.metadata = data;
                            });
                    };
                    
                    // Move up a directory
                    $scope.upDir = function() {
                        var path = $scope.path;
                        path = path.substr(0, path.lastIndexOf('/'));
                        if(path == '') path = '/';
                        $scope.setPath(path);
                    };
                    
                    // Toggle file selected state
                    $scope.toggleSelect = function(file) {
                        // Can't select directories
                        if(file.is_dir) return;
                        
                        // Toggle selection
                        var selected = 'selected' in file ? file.selected : false;
                        if(selected) {
                            file.selected = false;
                            $scope.numFilesSelected--;
                        } else {
                            file.selected = true;
                            $scope.numFilesSelected++;
                        }
                    };
                    
                    $scope.addFiles = function() {
                        var files = [];
                        
                        // Add selected files to array
                        angular.forEach($scope.metadata.contents, function(file, key) {
                            if('selected' in file && file.selected) {
                                files.push({
                                    path: file.path
                                });
                                file.selected = false;
                            }
                        });
                        $scope.numFilesSelected = 0;
                        
                        // Add files
                        DropboxService.addDropboxFiles(dirFileId, files);
                    };

                    $scope.done = function() {
                        $modalInstance.close();
                    };
                    
                    $scope.numFilesSelected = 0;
                    $scope.setPath('/');
                }
            });

            return modal;
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
            backdrop: 'static',
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
