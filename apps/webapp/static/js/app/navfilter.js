var module = angular.module('navfilter', []);

module.factory('NavFilterService', function($rootScope) {
    return {
        team: null,
        user: null,
        taskforce: null,

        setTeam: function(team) {
            if(this.team != team) {
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
        },
    };
});

module.controller('NavFilterCtrl', function($scope, NavFilterService, TeamRepository, UserRepository, TaskForceRepository) {
    // Get list of all teams
    TeamRepository.list()
        .success(function(teams) {
            $scope.teams = teams;
        });

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
                
                // Show current user if member of selected team, otherwise show the first member
                if(userInTeam) {
                    NavFilterService.setUser($scope.currentUser);
                } else {
                    NavFilterService.setUser(users[0]);
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
        NavFilterService.setTeam(team);
    };

    // Select user click handler
    $scope.selectUser = function(user) {
        NavFilterService.setUser(user);
    };
    
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
    
    $scope.activeTeam = null;
    $scope.activeUser = null;
    $scope.taskforces = [];
});