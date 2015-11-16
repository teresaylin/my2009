var module = angular.module('tasks', []);

module.controller('TasksStateCtrl', function($scope, $modal, NavFilterService, TaskDialogService) {
    $scope.newTask = function() {
        var dlg = TaskDialogService.newTask();
    };
});

module.controller('TaskListCtrl', function($rootScope, $scope, $modal, $q, TaskRepository, TaskDialogService, NavFilterService) {
    function getSubtasks(task) {
        return $q(function(resolve, reject) {
            if('subtasks' in task) {
                // Already have subtasks
                resolve();
            } else {
                // Get subtasks
                TaskRepository.list({ parent: task.id })
                    .success(function(data) {
                        task.subtasks = data;
                        resolve();
                    });
            }
        });
    }

    $scope.showCompleted = false;
    $scope.title = 'Tasks';

    var updateTitle = function() {
        $scope.title = 'Tasks';

        if(!$scope.filterCustom) {
            if($scope.filterUserOwned) {
                $scope.title = 'Tasks owned by ';
                if($scope.filterUserOwned.id == $scope.$parent.$parent.currentUser.id) {
                    $scope.title += 'me';
                } else {
                    $scope.title += $scope.filterUserOwned.full_name;
                }

                if($scope.filterTaskforce) {
                    $scope.title += ' and assigned to '+$scope.filterTaskforce.name;
                }
            } else {
                if($scope.filterUser || $scope.filterTaskforce) {
                    $scope.title = 'Tasks assigned to ';
                    if($scope.filterUser && $scope.filterUser.id == $scope.$parent.$parent.currentUser.id) {
                        $scope.title += 'me';
                    } else {
                        $scope.title += $scope.filterUser.full_name;
                    }

                    if($scope.filterTaskforce) {
                        $scope.title += $scope.filterTaskforce.name;
                    }
                } else if(!$scope.filterUser && !$scope.filterTaskforce) {
                    $scope.title = NavFilterService.team.name+' team tasks';
                }
            }
        }
    }

    var refreshTasks = function() {
        if(!NavFilterService.team) return;

        updateTitle();

        $scope.loading = true;

        // Get list of tasks
        var query = {
            tree: true
        };

        if(!$scope.showCompleted) {
            query['exclude-completed'] = true;
        }

        if($scope.filterCustom && !_.isEmpty($scope.filterCustom)) {
            query.custom = $scope.filterCustom;
        } else {
            query.team = NavFilterService.team.id;

            if($scope.filterUser) {
                query.user = $scope.filterUser.id;
            }
            if($scope.filterTaskforce) {
                query.taskforce = $scope.filterTaskforce.id;
            }
            if($scope.filterUserOwned) {
                query['user-owned'] = $scope.filterUserOwned.id;
            }
        }
        
        TaskRepository.list(query)
            .success(function(tasks) {
                $scope.tasks = tasks;
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    $scope.$on('navFilterChanged', function(event, changed) {
        if('team' in changed) {
            $scope.navTeam = NavFilterService.team;
        }
    });
    $scope.navTeam = NavFilterService.team;

    // Refresh tasks if filters change
    $scope.$watchCollection('[filterUser, filterTaskforce, filterUserOwned, filterCustom, showCompleted]', function(val) {
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
        refreshTasks();
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
    
    $scope.toggleTaskCompleted = function(task) {
        getSubtasks(task).then(function() {
            var promise = null;
            var completing = task.state != 'completed';

            if(task.subtasks.length > 0) {
                // Show confirm dialog
                var modal = $modal.open({
                    backdrop: 'static',
                    templateUrl: partial('tasks/complete-dialog.html'),
                    controller: function($scope, $modalInstance, TaskRepository, completing) {
                        $scope.task = task;
                        $scope.completing = completing;
                        
                        $scope.ok = function(form) {
                            $modalInstance.close();
                        };

                        $scope.cancel = function() {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve: {
                        completing: function() {
                            return completing;
                        }
                    }
                });

                promise = modal.result;
            } else {
                promise = $q(function(resolve) { resolve(); });
            }
            
            promise.then(function() {
                if(completing) {
                    // Mark task as completed
                    TaskRepository.complete(task.id)
                        .success(function(data) {
                            // Update task
                            angular.copy(data, task);
                            $rootScope.$broadcast('taskUpdated', data);
                        });
                } else {
                    // Mark task as not completed
                    TaskRepository.uncomplete(task.id)
                        .success(function(data) {
                            // Update task
                            angular.copy(data, task);
                            $rootScope.$broadcast('taskUpdated', data);
                        });
                }
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
            getSubtasks(task);
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
                    element.attr('title', names);
                }
            });
        }
    };
});

module.directive('taskList', function() {
    return {
        restrict: 'E',
        scope: {
            filterUser: '=',
            filterTaskforce: '=',
            filterUserOwned: '=',
            filterCustom: '=',
            showCustomize: '=',
            onCustomize: '&'
        },
        templateUrl: partial('tasks/task-list.html'),
        controller: 'TaskListCtrl'
    };
});

module.controller('TaskDialogCtrl', function($rootScope, $scope, $modalInstance, TaskRepository, TaskDialogService, FileRepository, FileDialogService, NavFilterService, task, parent) {
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
        loadTask(task);
    } else {
        // Creating new event
        newTask();
    }
    
    $scope.edit = function() {
        $scope.editing = true;
        // Create a copy of the task for editing
        $scope.task = angular.copy($scope.task);
    };

    $scope.removeDueTime = function(form) {
        $scope.task.due_time = null;
        form.$setDirty();
    }
    
    $scope.create = function(form) {
        $scope.task.team = NavFilterService.team.id;

        // Create task
        TaskRepository.create($scope.task)
            .success(function(data) {
                $rootScope.$broadcast('taskCreated', data);
                // Refresh task with returned data
                loadTask(data);
                form.$setPristine();

                $scope.assigneeTabActive = true;
            });
    };

    $scope.update = function(form) {
        // Update task
        TaskRepository.update($scope.task.id, $scope.task)
            .success(function(data) {
                $rootScope.$broadcast('taskUpdated', data);
                // Refresh task with returned data
                loadTask(data);
                form.$setPristine();
            });
    };
    
    $scope.delete = function() {
        // Open delete task dialog
        TaskDialogService.deleteTask($scope.task).result
            .then(function(deleted) {
                if(deleted) {
                    $modalInstance.close();
                }
            });
    };

    $scope.close = function() {
        $modalInstance.close();
    };
        
    $scope.addAssignedUser = function(user) {
        TaskRepository.addAssignedUser($scope.task.id, user.id)
            .success(function() {
                $scope.task.assigned_users.push(user);
                $rootScope.$broadcast('taskUpdated', $scope.task);
            });
    };

    $scope.removeAssignedUser = function(user) {
        TaskRepository.removeAssignedUser($scope.task.id, user.id)
            .success(function() {
                var assignedUsers = $scope.task.assigned_users;
                assignedUsers.splice(assignedUsers.indexOf(user), 1);
                $rootScope.$broadcast('taskUpdated', $scope.task);
            });
    };

    $scope.addAssignedTaskforce = function(taskforce) {
        TaskRepository.addAssignedTaskforce($scope.task.id, taskforce.id)
            .success(function() {
                $scope.task.assigned_taskforces.push(taskforce);
                $rootScope.$broadcast('taskUpdated', $scope.task);
            });
    };

    $scope.removeAssignedTaskforce = function(taskforce) {
        TaskRepository.removeAssignedTaskforce($scope.task.id, taskforce.id)
            .success(function() {
                var assignedTaskforces = $scope.task.assigned_taskforces;
                assignedTaskforces.splice(assignedTaskforces.indexOf(taskforce), 1);
                $rootScope.$broadcast('taskUpdated', $scope.task);
            });
    };

    $scope.addFile = function(path) {
        TaskRepository.addFile($scope.task.id, path)
            .success(function() {
                $scope.task.files.push(path);
                $rootScope.$broadcast('taskUpdated', $scope.task);
            });
    };

    $scope.removeFile = function(path) {
        TaskRepository.removeFile($scope.task.id, path)
            .success(function() {
                var files = $scope.task.files;
                files.splice(files.indexOf(path), 1);
                $rootScope.$broadcast('taskUpdated', $scope.task);
            });
    };
    
    $scope.openFile = function(path) {
        FileRepository.metadata(path)
            .success(function(file) {
                FileDialogService.openFile(file);
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
