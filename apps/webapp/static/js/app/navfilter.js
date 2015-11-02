var module = angular.module('navfilter', []);

module.factory('NavFilterService', function($rootScope) {
    return {
        team: null,
        user: null,
        taskforce: null,

        setTeam: function(team, refresh) {
            if(this.team != team || refresh) {
                this.team = team;
                $rootScope.$broadcast('navFilterChanged', {
                    'team': true
                });
            }
        },
        setUser: function(user) {
            var changed = {};
            
            if(this.taskforce != null) {
                this.taskforce = null;
                changed.taskforce = true;
            }
            
            if(this.user != user) {
                this.user = user;
                changed.user = true;
            }

            if(!jQuery.isEmptyObject(changed)) {
                $rootScope.$broadcast('navFilterChanged', changed);
            }
        },
        setTaskforce: function(taskforce) {
            var changed = {};
            
            if(this.user != null) {
                this.user = null;
                changed.user = true;
            }

            if(this.taskforce != taskforce) {
                this.taskforce = taskforce;
                changed.taskforce = true;
            }

            if(!jQuery.isEmptyObject(changed)) {
                $rootScope.$broadcast('navFilterChanged', changed);
            }
        }
    };
});

module.controller('NavFilterCtrl', function($scope, NavFilterService, TeamRepository, UserRepository, TaskForceRepository) {
    var initUser = function(user) {
        var filter = {};
        
        // Restrict list to teams user belongs to if non-superuser; otherwise show all
        if(!user.is_superuser) {
            filter.current = true;
        }

        // Get list of teams
        TeamRepository.list(filter)
            .success(function(teams) {
                $scope.teams = teams;
                
                // Default to home page
                $scope.selectHome();
            });
    };
    
    var setTeam = function(team) {
        // Check if the current user is in this team
        var userInTeam = false;
        angular.forEach($scope.currentUser.teams, function(userTeam) {
            if(team.id == userTeam.id) {
                userInTeam = true;
            }
        });
                
        // Update users list with only users in active team
        UserRepository.list({ teams: team.id })
            .success(function(users) {
                $scope.users = users;

                // Move current user to top of lise (if applicable)
                var curUserIdx = null;
                for(var i = 0; i < users.length; i++) {
                    if(users[i].id == $scope.currentUser.id) {
                        curUserIdx = i;
                        break;
                    }
                }
                if(curUserIdx) {
                    var curUser = users.splice(curUserIdx, 1);
                    users.unshift(curUser[0]);
                }
                
                // Select current user if in home view
                if($scope.homeSelected) {
                    NavFilterService.setUser(users[0]);
                } else {
                    NavFilterService.setUser(null);
                }
            });
            
        // Get root task forces for this team
        TaskForceRepository.list({ team: team.id, root: true})
            .success(function(taskforces) {
                $scope.taskforces = [{
                    idx: 0,
                    active: null,
                    list: taskforces
                }];
            });

        $scope.activeTeam = team;
    };

    var setUser = function(user) {
        $scope.activeUser = user;
        if(user) {
            $scope.taskforces.splice(1);
        }
    };
    
    // Select team click handler
    $scope.selectTeam = function(team) {
        $scope.homeSelected = false;
        NavFilterService.setTeam(team);
        NavFilterService.setUser(null);
    };

    // Select user click handler
    $scope.selectUser = function(user) {
        $scope.homeSelected = false;
        NavFilterService.setUser(user);
    };

    // Home button handler
    $scope.selectHome = function() {
        $scope.homeSelected = true;

        // Select the current user's first team. This will also select the current user as well.
        angular.forEach($scope.teams, function(team) {
            if(team.id == $scope.currentUser.teams[0].id) {
                NavFilterService.setTeam(team, true);
            }
        });
    }
    
    $scope.selectTaskforce = function(taskforce, level) {
        $scope.taskforces[level].active = taskforce;
        $scope.taskforces.splice(level+1);
        
        TaskForceRepository.list({ parent_task_force: taskforce.id })
            .success(function(taskforces) {
                $scope.taskforces[level+1] = {
                    idx: level+1,
                    active: null,
                    list: taskforces
                };
            });

        NavFilterService.setTaskforce(taskforce);
    };
    
    // Listen to team/user changes from NavFilterService
    $scope.$on('navFilterChanged', function(event, changed) {
        if('team' in changed) {
            setTeam(NavFilterService.team);
        }
        if('user' in changed) {
            setUser(NavFilterService.user);
        }
    });
    
    // Add newly created taskforces to taskforce lists
    $scope.$on('taskforceCreated', function(event, taskforce) {
        if($scope.activeTeam && $scope.activeTeam.id == taskforce.team) {
            var parent = null;
            angular.forEach($scope.taskforces, function(tf) {
                if(parent == taskforce.parent_task_force) {
                    tf.list.push(taskforce);
                }
                parent = tf.active ? tf.active.id : null;
            });
        }
    });

    // Remove delete taskforces from taskforce lists
    $scope.$on('taskforceDeleted', function(event, taskforce) {
        if($scope.activeTeam && $scope.activeTeam.id == taskforce.team) {
            angular.forEach($scope.taskforces, function(tf) {
                if(tf.active && tf.active.id == taskforce.id) {
                    tf.active = null;
                    $scope.taskforces.splice(tf.idx+1);
                    NavFilterService.setTaskforce(taskforce.parent_task_force);
                }
                
                angular.forEach(tf.list, function(listTaskforce, idx) {
                    if(listTaskforce.id == taskforce.id) {
                        tf.list.splice(idx, 1);
                    }
                });
            });
        }
    });
    
    $scope.activeTeam = null;
    $scope.activeUser = null;
    $scope.taskforces = [];

    // If we already have the currentUser object, initialize; otherwise wait for event to be fired
    if('currentUser' in $scope && $scope.currentUser) {
        initUser($scope.currentUser);
    }
    $scope.$on('gotCurrentUser', function(event, user) {
        initUser(user);
    });

});
