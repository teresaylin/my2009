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
dropbox.filter('basename', function() {
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

module.controller('FilesListCtrl', function($scope, $modal, FileRepository, DropboxUploadService) {

    $scope.init = function(rootDirId) {
        $scope.rootDirId = rootDirId;
        $scope.setDirectory(rootDirId);
    };
    
    $scope.refresh = function() {
        // Retrieve directory listing
        FileRepository.get($scope.directory.id)
            .success(function(dir) {
                $scope.directory = dir;
            });
    };

    $scope.setDirectory = function(id) {
        // Retrieve directory listing
        FileRepository.get(id)
            .success(function(dir) {
                $scope.directory = dir;
            });
    };
        
    // Called when user clicks a file/directory
    $scope.openFile = function(file) {
        if(file.is_directory) {
            $scope.setDirectory(file.id);
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
        var modal = $modal.open({
            templateUrl: partial('files/create-folder-dialog.html'),
            controller: function($scope, $modalInstance, DropboxService) {
                $scope.nameChanged = function(form) {
                    // Reset invalidName flag when name changes
                    form.name.$setValidity('invalidName', true);
                };

                $scope.create = function(form) {
                    // Create subdirectory
                    FileRepository.createSubdirectory(1, form.nameValue)
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