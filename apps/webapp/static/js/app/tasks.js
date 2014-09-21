var module = angular.module('tasks', []);

module.controller('TasksStateCtrl', function($scope, $modal, NavFilterService, TaskDialogService) {
    $scope.$on('navFilterChanged', function(event, changed) {
        if('user' in changed || 'taskforce' in changed) {
            $scope.navUser = NavFilterService.user;
            $scope.navTaskforce = NavFilterService.taskforce;
        }
    });
    $scope.navUser = NavFilterService.user;
    $scope.navTaskforce = NavFilterService.taskforce;

    $scope.newTask = function() {
        var dlg = TaskDialogService.newTask();
    };
});

module.controller('TaskListCtrl', function($rootScope, $scope, $modal, TaskRepository, TaskDialogService) {
    var refreshTasks = function() {
        // Get list of tasks
        var query = {};

        if($scope.filterUser) {
            query.user = $scope.filterUser.id;
        }
        if($scope.filterTaskforce) {
            query.taskforce = $scope.filterTaskforce.id;
        }
        
        if(!jQuery.isEmptyObject(query)) {
            query.tree = true;
            TaskRepository.list(query)
                .success(function(tasks) {
                    $scope.tasks = tasks;
                });
        }
    };

    // Refresh tasks if filterUser or filterTaskforce attribute changes
    $scope.$watchCollection('[filterUser, filterTaskforce]', function(val) {
        if(val) {
            refreshTasks();
        }
    });

    // Recursively scan a list of tasks for a specific task, returns list and index
    var findTask = function(list, id) {
        for(var i = 0; i < list.length; i++) {
            var task = list[i];
            if(task.id == id) {
                return [list, i];
            } else {
                if('subtasks' in task) {
                    var descTask = findTask(task.subtasks, id);
                    if(descTask) {
                        return descTask;
                    }
                }
            }
        }
        return null;
    };

    // Listen for taskCreated signal
    $scope.$on('taskCreated', function(event, task) {
        refreshTasks();
    });
    
    // Listen for taskUpdated signal
    $scope.$on('taskUpdated', function(event, updatedTask) {
        // Find task in tree
        var result = findTask($scope.tasks, updatedTask.id);
        if(result) {
            var list = result[0];
            var listIdx = result[1];
            var task = list[listIdx];

            // Remove completed tasks
            if(updatedTask.state == 'completed') {
                list.splice(listIdx, 1);
            }

            // Only copy the task data if they aren't referencing the same object
            if(task != updatedTask) {
                angular.copy(updatedTask, task);
            }
        }
    });

    // Listen for taskDeleted signal
    $scope.$on('taskDeleted', function(event, task) {
        // Find task in tree
        var result = findTask($scope.tasks, task.id);
        if(result) {
            var list = result[0];
            var listIdx = result[1];
            
            // Remove task
            list.splice(listIdx, 1);
        }
    });
    
    $scope.completeTask = function(task) {
        // Show confirm dialog
        var modal = $modal.open({
            backdrop: 'static',
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
                    $rootScope.$broadcast('taskUpdated', data);
                });
        });
    };

    $scope.openTask = function(task) {
        var dlg = TaskDialogService.openTask(task);
    };

    $scope.deleteTask = function(task) {
        var dlg = TaskDialogService.deleteTask(task);
    };
    
    $scope.toggleTask = function(task, shown) {
        if(shown) {
            // Get subtasks if not already loaded
            if(!('subtasks' in task)) {
                TaskRepository.list({ parent: task.id })
                    .success(function(data) {
                        task.subtasks = data;
                    });
            }
        }
    };

    $scope.newTask = function(parentTask) {
        var dlg = TaskDialogService.newTask(parentTask);
    };
    
    $scope.moreTasks = function(task) {
        if('_hasPartialSubtasks' in task && task._hasPartialSubtasks) {
            TaskRepository.list({ parent: task.id })
                .success(function(data) {
                    // Merge new tasks into existing subtasks array
                    angular.forEach(data, function(newChild) {
                        var exists = false;
                        angular.forEach(task.subtasks, function(child) {
                            if(child.id == newChild.id) {
                                exists = true;
                            }
                        });
                        if(!exists) {
                            task.subtasks.push(newChild);
                        }
                    });
                    task._hasPartialSubtasks = false;
                });
        }
    };
});

module.directive('taskAssignees', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            scope.$watch(attrs.taskAssignees, function(task) {
                if(task) {
                    var names = [];
                    angular.forEach(task.assigned_taskforces, function(tf) {
                        names.push(tf.name);
                    });
                    angular.forEach(task.assigned_users, function(user) {
                        names.push(user.full_name);
                    });
                    names = names.join(', ');
                    element.text(names);
                }
            });
        }
    };
});

module.directive('taskList', function() {
    return {
        restrict: 'E',
        scope: {
            'filterUser': '=',
            'filterTaskforce': '='
        },
        templateUrl: partial('tasks/task-list.html'),
        controller: 'TaskListCtrl'
    };
});

module.controller('TaskDialogCtrl', function($rootScope, $scope, $modalInstance, TaskRepository, TaskDialogService, task, parent) {
    var changesMade = false; // This is set when a task is created/edited
    var taskCreated = false; // This is set when a task is created
    
    var loadTask = function(taskData) {
        $scope.task = taskData;
        $scope.creating = false;
        $scope.editing = false;
    };
    
    var newTask = function() {
        $scope.task = {
            'parent': parent ? parent.id : null
        };
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
                taskCreated = true;
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

    $scope.close = function() {
        if(taskCreated) {
            $rootScope.$broadcast('taskCreated', $scope.task);
        } else if(changesMade) {
            $rootScope.$broadcast('taskUpdated', $scope.task);
        }
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
        openTask: function(task, parent) {
            var modal = $modal.open({
                backdrop: 'static',
                templateUrl: partial('tasks/task-dialog.html'),
                controller: 'TaskDialogCtrl',
                resolve: {
                    task: function() {
                        return task;
                    },
                    parent: function() {
                        return parent;
                    }
                }
            });
            
            return modal;
        },
        newTask: function(parent) {
            return this.openTask(null, parent);
        },
        deleteTask: function(task) {
            var modal = $modal.open({
                backdrop: 'static',
                templateUrl: partial('tasks/delete-dialog.html'),
                controller: function($rootScope, $scope, $modalInstance, TaskRepository, task) {
                    $scope.task = task;
                    
                    $scope.delete = function() {
                        // Delete task
                        TaskRepository.delete($scope.task.id)
                            .success(function() {
                                $rootScope.$broadcast('taskDeleted', $scope.task);
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
