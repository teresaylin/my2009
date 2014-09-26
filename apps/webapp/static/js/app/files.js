var module = angular.module('files', []);

// 'filename' directive
module.directive('filename', function() {
    return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
            ctrl.$parsers.unshift(function(viewValue) {
                if(/[\[\]\/\\=+<>:;",*]/.test(viewValue)) {
                    // Invalid filename
                    ctrl.$setValidity('filename', false);
                    return undefined;
                } else {
                    // Valid filename
                    ctrl.$setValidity('filename', true);
                    return viewValue;
                }
            });
        }
    };
});

// 'basename' filter: get filename from full path
module.filter('basename', function() {
    return function(path) {
        return path.substr(path.lastIndexOf('/') + 1);
    };
});

// 'filesize' filter: get human-friendly file size
module.filter('filesize', function() {
    return function(sizeBytes) {
        if(sizeBytes > 1024*1024*1024) {
            return (sizeBytes / 1024*1024*1024).toFixed(1) + ' GB';
        } else if(sizeBytes > 1024*1024) {
            return (sizeBytes / 1024*1024).toFixed(1) + ' MB';
        } else if(sizeBytes > 1024) {
            return (sizeBytes / 1024).toFixed(1) + ' KB';
        } else {
            return sizeBytes + ' bytes';
        }
    };
});

module.directive('pathBreadcrumbs', function() {
    return {
        restrict: 'E',
        scope: {
            pathChange: '&'
        },
        templateUrl: 'components/path-breadcrumbs.html',
        link: function(scope, elm, attrs) {
            scope.$parent.$watch(attrs.path, function(path) {
                if(path) {
                    var fragments = path.split('/');
                    
                    // Remove empty fragments caused by leading and trailing slashes
                    if(fragments.length > 0 && fragments[0] == '') {
                        fragments.shift();
                    }
                    if(fragments.length > 0 && fragments[fragments.length-1] == '') {
                        fragments.pop();
                    }

                    scope.fragments = fragments;
                }
            });
            
            scope.fragmentClicked = function(idx) {
                var path = scope.fragments.slice(0, idx+1);
                path = '/' + path.join('/');
                scope.pathChange({ path: path });
            };
        }
    };
});

module.factory('FileRepository', function($http) {
    var baseUrl = '/api/files/';
    
    return {
        metadata: function(path) {
            return $http.get(baseUrl+'metadata/', { params: {
                path: path                
            }});
        },
        createFolder: function(path) {
            return $http.post(baseUrl+'create-folder/', {
                'path': path
            });
        }
        /*
        getFileShare: function(id) {
            return $http.get(baseUrl+id+'/share/');
        }
        */
    };
});

module.controller('FileBrowserCtrl', function($scope, $modal, FileRepository) {
    
    var initialDir = '/Green';
    
    $scope.refresh = function() {
        // Retrieve metadata
        FileRepository.metadata($scope.directory.path)
            .success(function(data) {
                $scope.directory = data;
            });
    };

    $scope.setDirectory = function(path) {
        // Retrieve metadata
        FileRepository.metadata(path)
            .success(function(data) {
                $scope.directory = data;
            });
    };
    
    $scope.setDirectory(initialDir);
        
    // Called when user clicks a file/directory
    $scope.openFile = function(file) {
        if(file.is_dir) {
            $scope.setDirectory(file.path);
        } else {
            // TEMPORARY: open Dropbox share in new window
            FileRepository.getFileShare(file.id)
                .success(function(data) {
                    window.open(data.url, 'ShareWindow', 'width=640,height=480');
                });
        }
    };
    
    $scope.delete = function() {
        // Queue files for deletion
        var promise = null;
        angular.forEach($scope.directory.files, function(file) {
            if('selected' in file && file.selected) {
                if(!promise) {
                    promise = FileRepository.delete(file.id);
                } else {
                    promise.then(function() {
                        FileRepository.delete(file.id);
                    });
                }
            }
        });

        // Refresh directory listing when finished deleting
        if(promise) {
            promise.then(function() {
                $scope.refresh();
            });
        }
    };
    
    $scope.openUploadDialog = function() {
        // Open upload dialog
        var dlg = DropboxUploadService.openUploadDialog($scope.directory.id);
        
        dlg.result.then(function() {
            // Refresh directory listing
            $scope.refresh();
        });
    };

    $scope.openCreateFolderDialog = function() {
        if(!$scope.directory) return;
        var path = $scope.directory.path;
        
        var modal = $modal.open({
            backdrop: 'static',
            templateUrl: partial('files/create-folder-dialog.html'),
            controller: function($scope, $modalInstance, FileRepository) {
                $scope.nameChanged = function(form) {
                    // Reset invalidName flag when name changes
                    form.name.$setValidity('invalidName', true);
                };

                $scope.create = function(form) {
                    // Create subdirectory
                    FileRepository.createFolder(path+'/'+form.nameValue)
                        .success(function() {
                            $modalInstance.close();
                        })
                        .error(function(data, status) {
                            if(status == 400) {
                                form.name.$setValidity('invalidName', false);
                            }
                        });
                };
                
                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            }
        });
        
        modal.result.then(function() {
            // Refresh directory listing
            $scope.refresh();
        });
    };
});
