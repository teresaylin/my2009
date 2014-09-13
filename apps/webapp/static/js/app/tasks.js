var module = angular.module('tasks', []);

module.controller('TasksStateCtrl', function($scope, $modal, TaskRepository, TaskDialogService) {
    var refreshTasks = function() {
        // Get list of all tasks
        TaskRepository.list()
            .success(function(tasks) {
                $scope.tasks = tasks;
            });
    };
    refreshTasks();
    
    $scope.onCompletedChange = function(task, completed) {
        if(completed) {
            // Show confirm dialog
            var modal = $modal.open({
                templateUrl: partial('tasks/complete-dialog.html'),
                controller: function($scope, $modalInstance, TaskRepository) {
                    $scope.task = task;
                    
                    $scope.ok = function(form) {
                        $modalInstance.close();
                    };
    
                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                }
            });
            
            modal.result.then(function() {
                // Mark task as completed
                TaskRepository.complete(task.id)
                    .success(function(data) {
                        // Update task
                        angular.copy(data, task);
                    });
            });
        }
    };

    $scope.newTask = function() {
        var dlg = TaskDialogService.newTask();
        
        dlg.result.then(function(changesMade) {
            if(changesMade) {
                refreshTasks();
            }
        });
    };

    $scope.openTask = function(task) {
        var dlg = TaskDialogService.openTask(task);
        
        dlg.result.then(function(changesMade) {
            if(changesMade) {
                refreshTasks();
            }
        });
    };

    $scope.deleteTask = function(task) {
        var dlg = TaskDialogService.deleteTask(task);
        
        dlg.result.then(function(changesMade) {
            if(changesMade) {
                refreshTasks();
            }
        });
    };
});

module.controller('TaskDialogCtrl', function($scope, $modalInstance, TaskRepository, TaskDialogService, task) {
    var changesMade = false; // This is set when a taskis created/edited
    
    var loadTask = function(taskData) {
        $scope.task = taskData;
        $scope.creating = false;
        $scope.editing = false;
    };
    
    var newTask = function() {
        $scope.task = {};
        $scope.creating = true;
        $scope.editing = true;
    };
    
    if(task) {
        // Opening existing event
        loadTask(angular.copy(task));
    } else {
        // Creating new event
        newTask();
    }
    
    $scope.edit = function() {
        $scope.editing = true;
    };
    
    $scope.create = function(form) {
        // Create task
        TaskRepository.create($scope.task)
            .success(function(data) {
                changesMade = true;
                // Refresh task with returned data
                loadTask(data);
                form.$setPristine();
            });
    };

    $scope.update = function(form) {
        // Update task
        TaskRepository.update($scope.task.id, $scope.task)
            .success(function(data) {
                changesMade = true;
                // Refresh task with returned data
                loadTask(data);
                form.$setPristine();
            });
    };
    
    $scope.delete = function() {
        // Open delete task dialog
        TaskDialogService.deleteTask(task).result
            .then(function(deleted) {
                if(deleted) {
                    $modalInstance.close(true);
                }
            });
    };

    $scope.cancel = function() {
        $modalInstance.close(changesMade);
    };
        
    $scope.addAssignedUser = function(user) {
        TaskRepository.addAssignedUser($scope.task.id, user.id)
            .success(function() {
                $scope.task.assigned_users.push(user);
            });
    };

    $scope.removeAssignedUser = function(user) {
        TaskRepository.removeAssignedUser($scope.task.id, user.id)
            .success(function() {
                var assignedUsers = $scope.task.assigned_users;
                assignedUsers.splice(assignedUsers.indexOf(user), 1);
            });
    };

    $scope.addAssignedTaskforce = function(taskforce) {
        TaskRepository.addAssignedTaskforce($scope.task.id, taskforce.id)
            .success(function() {
                $scope.task.assigned_taskforces.push(taskforce);
            });
    };

    $scope.removeAssignedTaskforce = function(taskforce) {
        TaskRepository.removeAssignedTaskforce($scope.task.id, taskforce.id)
            .success(function() {
                var assignedTaskforces = $scope.task.assigned_taskforces;
                assignedTaskforces.splice(assignedTaskforces.indexOf(taskforce), 1);
            });
    };
});

module.factory('TaskDialogService', function($modal) {
    return {
        openTask: function(task) {
            var modal = $modal.open({
                templateUrl: partial('tasks/task-dialog.html'),
                controller: 'TaskDialogCtrl',
                resolve: {
                    task: function() {
                        return task;
                    }
                }
            });
            
            return modal;
        },
        newTask: function() {
            return this.openTask(null);
        },
        deleteTask: function(task) {
            var modal = $modal.open({
                templateUrl: partial('tasks/delete-dialog.html'),
                controller: function($scope, $modalInstance, TaskRepository, task) {
                    $scope.task = task;
                    
                    $scope.delete = function() {
                        // Delete task
                        TaskRepository.delete($scope.task.id)
                            .success(function() {
                                $modalInstance.close(true);
                            });
                    };
                    
                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                },
                resolve: {
                    task: function() {
                        return task;
                    }
                }
            });
            
            return modal;
        }
    };
});

module.controller('TaskDetailStateCtrl', function($scope, $stateParams, TaskRepository) {
    // Get task
    TaskRepository.get($stateParams.taskId)
        .success(function(task) {
            $scope.task = task;
        });
        
    $scope.addAssignedUser = function(user) {
        TaskRepository.addAssignedUser($scope.task.id, user.id)
            .success(function() {
                $scope.task.assigned_users.push(user);
            });
    };

    $scope.removeAssignedUser = function(user) {
        TaskRepository.removeAssignedUser($scope.task.id, user.id)
            .success(function() {
                var assignedUsers = $scope.task.assigned_users;
                assignedUsers.splice(assignedUsers.indexOf(user), 1);
            });
    };

    $scope.addAssignedTaskforce = function(taskforce) {
        TaskRepository.addAssignedTaskforce($scope.task.id, taskforce.id)
            .success(function() {
                $scope.task.assigned_taskforces.push(taskforce);
            });
    };

    $scope.removeAssignedTaskforce = function(taskforce) {
        TaskRepository.removeAssignedTaskforce($scope.task.id, taskforce.id)
            .success(function() {
                var assignedTaskforces = $scope.task.assigned_taskforces;
                assignedTaskforces.splice(assignedTaskforces.indexOf(taskforce), 1);
            });
    };
});
