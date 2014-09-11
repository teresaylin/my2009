var module = angular.module('tasks', []);

module.controller('TasksStateCtrl', function($scope, $modal, TaskRepository) {
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

    // Create/update a task
    $scope.openEditTaskDialog = function(task) {
        var modal = $modal.open({
            templateUrl: partial('tasks/edit-dialog.html'),
            controller: function($scope, $modalInstance, TaskRepository) {
                if(task) {
                    // Editing existing task
                    $scope.creating = false;
                    $scope.task = angular.copy(task);
                } else {
                    // Creating new task
                    $scope.creating = true;
                    $scope.task = {
                        order: 0
                    };
                }
                
                $scope.create = function(form) {
                    // Create task
                    TaskRepository.create($scope.task)
                        .success(function() {
                            $modalInstance.close();
                        });
                };
                
                $scope.update = function(form) {
                    // Update task
                    TaskRepository.update($scope.task.id, $scope.task)
                        .success(function() {
                            // Overwrite original object with updated object
                            angular.copy($scope.task, task);
                            $modalInstance.close();
                        });
                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            }
        });
        
        modal.result.then(function() {
            // Refresh tasks list if new task has been created
            if(!task) {
                refreshTasks();
            }
        });
    };

    // Delete task 
    $scope.openDeleteTaskDialog = function(task) {
        var modal = $modal.open({
            templateUrl: partial('tasks/delete-task-dialog.html'),
            controller: function($scope, $modalInstance, TaskRepository) {
                $scope.task = task;
                
                $scope.delete = function(form) {
                    // Delete task
                    TaskRepository.delete(task.id)
                        .success(function() {
                            $modalInstance.close();
                        });
                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            }
        });
        
        modal.result.then(function() {
            // Refresh tasks after deletion
            refreshTasks();
        });
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
