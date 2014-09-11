var module = angular.module('users', []);

module.controller('UserDetailStateCtrl', function($scope, $stateParams, $modal, UserRepository) {
    // Get user
    UserRepository.get($stateParams.userId)
        .success(function(user) {
            $scope.user = user;
        });
        
    $scope.openEditProfileDialog = function() {
        var modal = $modal.open({
            templateUrl: partial('users/edit-profile-dialog.html'),
            controller: function($scope, $modalInstance, user) {
                if(user.profile) {
                    // Copy existing profile
                    $scope.profile = angular.copy(user.profile);
                } else {
                    // Create new profile
                    $scope.profile = {};
                }
                
                $scope.ok = function(form) {
                    // Update profile
                    UserRepository.updateProfile(user.id, $scope.profile)
                        .success(function() {
                            $modalInstance.close($scope.profile);
                        });
                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            },
            resolve: {
                user: function() {
                    return $scope.user;
                }
            }
        });
        
        modal.result.then(function(profile) {
            // Add updated profile to user object
            $scope.user.profile = profile;
        });
    };
});

module.controller('TeamStateCtrl', function($scope, $modal, NavFilterService, TeamRepository, UserRepository, TaskForceRepository) {
    var update = function() {
        if(NavFilterService.team) {
            $scope.team = NavFilterService.team;

            // Get list of users in selected team
            UserRepository.list({ teams: NavFilterService.team.id })
                .success(function(users) {
                    $scope.users = users;
                });
            
            // Get root task forces
            TaskForceRepository.list({
                team: NavFilterService.team.id,
                root: true
            })
                .success(function(data) {
                    $scope.taskForces = data;
                });
        }
    };
    
    // Called when user opens a task force in the accordion
    $scope.getTaskForceChildren = function(taskForce) {
        // Get taskForce children if they don't exist
        if(!('children' in taskForce)) {
            TaskForceRepository.get(taskForce.id)
                .success(function(data) {
                    taskForce.children = data.children;
                });
        }
    };
    
    // Create/update a task force
    $scope.openEditTaskForceDialog = function(taskforce, parent) {
        var modal = $modal.open({
            templateUrl: partial('team/edit-taskforce-dialog.html'),
            controller: function($scope, $modalInstance, TaskForceRepository, MilestoneRepository, team) {
                $scope.hasParent = parent ? true : false;
                
                if(taskforce) {
                    // Editing existing taskforce
                    $scope.creating = false;
                    $scope.taskforce = angular.copy(taskforce);
                } else {
                    // Creating new taskforce
                    $scope.creating = true;
                    $scope.taskforce = {
                        milestone: parent ? parent.milestone : null,
                        team: team.id,
                        parent_task_force: parent ? parent.id : null
                    };
                }
                
                // Get list of all milestones
                MilestoneRepository.list()
                    .success(function(data) {
                        $scope.milestones = data;
                        
                        // Angular <select> detects the default selection by reference,
                        // so replace the existing milestone object with the copy in the list.
                        if($scope.taskforce.milestone) {
                            angular.forEach(data, function(milestone) {
                                if($scope.taskforce.milestone.id == milestone.id) {
                                    $scope.taskforce.milestone = milestone;
                                }
                            });
                        }
                    });
                
                $scope.create = function(form) {
                    // Create task force
                    $scope.taskforce.milestone_id = $scope.taskforce.milestone.id;
                    TaskForceRepository.create($scope.taskforce)
                        .success(function() {
                            $modalInstance.close();
                        });
                };
                
                $scope.update = function(form) {
                    // Update task force
                    $scope.taskforce.milestone_id = $scope.taskforce.milestone.id;
                    TaskForceRepository.update($scope.taskforce.id, $scope.taskforce)
                        .success(function() {
                            // Overwrite original object with updated object
                            angular.copy($scope.taskforce, taskforce);
                            $modalInstance.close();
                        });
                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            },
            resolve: {
                team: function() {
                    return $scope.team;
                }
            }
        });
        
        modal.result.then(function() {
            // If creating a new object
            if(!taskforce) {
                if(parent) {
                    // Refresh parent task force's children
                    TaskForceRepository.get(parent.id)
                        .success(function(data) {
                            parent.children = data.children;
                        });
                } else {
                    // No parent, refresh root task force list
                    update();
                }
            }
        });
    };
    
    // Delete task force
    $scope.openDeleteTaskForceDialog = function(taskforce) {
        var modal = $modal.open({
            templateUrl: partial('team/delete-taskforce-dialog.html'),
            controller: function($scope, $modalInstance, TaskForceRepository) {
                $scope.taskforce = taskforce;
                
                $scope.delete = function(form) {
                    // Delete task force
                    TaskForceRepository.delete(taskforce.id)
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
            var deletedId = taskforce.id;
            
            // Recursively scan task force tree and remove the deleted task force (urgh...)
            var scan = function(taskforces) {
                angular.forEach(taskforces, function(taskforce, idx) {
                    if(taskforce.id == deletedId) {
                        taskforces.splice(idx, 1);
                        return;
                    }
                    
                    if('children' in taskforce) {
                        scan(taskforce.children);
                    }
                });
            };
            scan($scope.taskForces);
        });
    };
    
    $scope.addTaskForceMember = function(taskforce, user) {
        TaskForceRepository.addMember(taskforce.id, user.id)
            .success(function() {
                taskforce.members.push(user);
            });
    };

    $scope.removeTaskForceMember = function(taskforce, user) {
        TaskForceRepository.removeMember(taskforce.id, user.id)
            .success(function() {
                taskforce.members.splice(taskforce.members.indexOf(user), 1);
            });
    };

    // Update users when team changes
    $scope.$on('navFilterTeamChanged', function() {
        update();
    });

    // Get users
    update();
});

module.directive('userPicture', function() {
    return {
        restrict: 'E',
        scope: {
            user: '=',
            size: '='
        },
        templateUrl: 'components/user-picture.html'
    };
});

module.directive('userPicker', function(UserRepository) {
    return {
        restrict: 'E',
        scope: {
            user: '=',
            restrictTeam: '='
        },
        templateUrl: 'components/user-picker.html',
        link: function(scope, element, attrs) {
            scope.search = function(q) {
                var params = {
                    search_name: q,
                    page_size: 10,
                };
                if(scope.restrictTeam) {
                    params.teams = scope.restrictTeam.id;
                }

                return UserRepository.list(params)
                    .then(function(res){
                        return res.data.results;
                    });
            };
        }
    };
});

module.directive('taskforcePicker', function(TaskForceRepository) {
    return {
        restrict: 'E',
        scope: {
            taskforce: '='
        },
        templateUrl: 'components/taskforce-picker.html',
        link: function(scope, element, attrs) {
            scope.search = function(q) {
                return TaskForceRepository.list({
                    search_name: q,
                    page_size: 10
                })
                    .then(function(res){
                        return res.data.results;
                    });
            };
        }
    };
});

module.directive('commentsSection', function($http, CommentRepository) {
    return {
        restrict: 'E',
        scope: {
        },
        templateUrl: 'components/comments-section.html',
        link: function(scope, element, attrs) {
            var threadId = null;

            scope.nextPageUrl = null;
            
            scope.$parent.$watch(attrs.threadId, function(val) {
                if(val) {
                    threadId = val;

                    // Get most recent comments
                    CommentRepository.list({
                        'thread': threadId,
                        'page_size': 10
                    })
                        .success(function(data) {
                            scope.comments = data.results;
                            scope.nextPageUrl = data.next;
                        });
                }
            });
            
            // Load older comments
            scope.more = function() {
                if(!scope.nextPageUrl) return;
                
                // Retrieve next page of comments and add to scope.comments
                $http.get(scope.nextPageUrl)
                    .success(function(data) {
                        Array.prototype.push.apply(scope.comments, data.results);
                        scope.nextPageUrl = data.next;
                    });
            };
            
            // Post comment from this user 
            scope.postComment = function(body) {
                var comment = {
                    'thread': threadId,
                    'body': body
                };

                CommentRepository.create(comment)
                    .success(function(newComment) {
                        scope.comments.unshift(newComment);
                    });
            };
        }
    };
});
