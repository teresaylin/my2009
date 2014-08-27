var app = angular.module('app', [
    'ui.router',
    'ui.bootstrap'
]);

app.factory('TaskRepository', function($http) {
    var baseUrl = '/api/tasks';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function() {
            return $http.get(baseUrl);
        }
    };
});

app.factory('TeamRepository', function($http) {
    var baseUrl = '/api/teams';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function() {
            return $http.get(baseUrl);
        }
    };
});

app.factory('UserRepository', function($http) {
    var baseUrl = '/api/users';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        getCurrentUser: function() {
            return $http.get(baseUrl+'/?current');
        },
        list: function(params) {
            return $http.get(baseUrl, { params: params });
        }
    };
});

app.config(function($stateProvider, $urlRouterProvider) {
    var partial = function(partial) {
        return '/static/partials/'+partial;
    }

    $urlRouterProvider
        .when('', '/')
        .otherwise('/not-found');

    $stateProvider
        .state('not-found', {
            url: '/not-found',
            templateUrl: partial('not-found.html')
        })
        // Dashboard
        .state('dashboard', {
            url: '/',
            templateUrl: partial('dashboard.html'),
            controller: function($scope, TaskRepository) {
                // Get list of all tasks
                TaskRepository.list()
                    .success(function(tasks) {
                        $scope.userTasks = tasks;
                    });
            }
        })
        // Users
        .state('user', {
            abstract: true,
            url: '/user'
        })
        .state('user.detail', {
            url: '/:userId',
            views: {
                '@': {
                    templateUrl: partial('user/detail.html'),
                    controller: function($scope, $stateParams, UserRepository) {
                        // Get user
                        UserRepository.get($stateParams.userId)
                            .success(function(user) {
                                $scope.user = user;
                            });
                    }
                }
            }
        })
        // Tasks
        .state('tasks', {
            url: '/tasks',
            templateUrl: partial('tasks/tasks.html')
        })
        .state('tasks.detail', {
            url: '/:taskId',
            views: {
                '@': {
                    templateUrl: partial('tasks/detail.html'),
                    controller: function($scope, $stateParams, TaskRepository) {
                        // Get task
                        TaskRepository.get($stateParams.taskId)
                            .success(function(task) {
                                $scope.task = task;
                            });
                    }
                }
            }
        })
        // Events
        .state('events', {
            url: '/events',
            templateUrl: partial('events/events.html')
        })
        ;
});

app.controller('AppCtrl', function($scope, UserRepository) {
    // Get current user
    UserRepository.getCurrentUser()
        .success(function(user) {
            $scope.currentUser = user[0];
        });
});

app.controller('NavFilterCtrl', function($scope, TeamRepository, UserRepository) {
    // Get list of all teams
    TeamRepository.list()
        .success(function(teams) {
            $scope.teams = teams;
            setTeam(teams[0]);
        });	

    var setTeam = function(team) {
        $scope.activeTeam = team;

		// Update users list with only users in active team
    	UserRepository.list({ teams: team.id })
            .success(function(users) {
                $scope.users = users;
                setUser(users[0]);
            });	
    };

    var setUser = function(user) {
        $scope.activeUser = user;
    };
    
    // Select team click handler
    $scope.selectTeam = function($event, team) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.teamSelectOpen = false;

    	setTeam(team);
    };

    // Select user click handler
    $scope.selectUser = function($event, user) {
        $event.preventDefault();
        $event.stopPropagation();

        $scope.userSelectOpen = false;

    	setUser(user);
    };
    
    $scope.activeTeam = null;
    $scope.activeUser = null;
    $scope.teamSelectOpen = false;
    $scope.userSelectOpen = false;
});
