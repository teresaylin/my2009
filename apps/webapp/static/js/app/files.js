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

// 'filesize' filter: get human-friendly file size
module.filter('filesize', function() {
    return function(sizeBytes) {
        if(sizeBytes > 1024*1024*1024) {
            return (sizeBytes / 1024*1024*1024) + ' GB';
        } else if(sizeBytes > 1024*1024) {
            return (sizeBytes / 1024*1024) + ' MB';
        } else if(sizeBytes > 1024) {
            return (sizeBytes / 1024) + ' KB';
        } else {
            return sizeBytes + ' bytes';
        }
    };
});

module.controller('FilesListCtrl', function($scope, $modal, FileRepository) {

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
        }
    };
    
    $scope.openUploadDialog = function() {
        var modal = $modal.open({
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
                
                $scope.upload = function() {
                };

                $scope.done = function() {
                    $modalInstance.close();
                };
                
                $scope.numFilesSelected = 0;
                $scope.setPath('/');
            }
        });
        
        modal.result.then(function() {
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