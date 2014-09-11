var app = angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'ui.calendar',
    
    'dropbox',
    'events',
    'files',
    'repositories',
    'tasks',
    'users'
]);

// App configuration
app.config(function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});

app.factory('NavFilterService', function($rootScope) {
    return {
        team: null,
        user: null,

        setTeam: function(team) {
            this.team = team;
            $rootScope.$broadcast('navFilterTeamChanged', team);
        },
        setUser: function(user) {
            this.user = user;
            $rootScope.$broadcast('navFilterUserChanged', user);
        }
    };
});

var partial = function(partial) {
    return '/static/partials/'+partial+'?'+(new Date()).valueOf();
};

app.config(function($stateProvider, $urlRouterProvider) {
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
            }
        })
        // Settings
        .state('settings', {
            url: '/settings',
            templateUrl: partial('settings.html'),
            controller: function($scope) {
            }
        })
        // Users
        .state('users', {
            url: '/users',
            abstract: true
        })
        .state('users.detail', {
            url: '/:userId',
            views: {
                '@': {
                    templateUrl: partial('users/detail.html'),
                    controller: 'UserDetailStateCtrl'
                }
            }
        })
        // Tasks
        .state('tasks', {
            url: '/tasks',
            templateUrl: partial('tasks/tasks.html'),
            controller: 'TasksStateCtrl'
        })
        .state('tasks.detail', {
            url: '/:taskId',
            views: {
                '@': {
                    templateUrl: partial('tasks/detail.html'),
                    controller: 'TaskDetailStateCtrl'
                }
            }
        })
        // Events
        .state('events', {
            url: '/events',
            templateUrl: partial('events/events.html')
        })
        .state('events.detail', {
            url: '/:eventId',
            views: {
                '@': {
                    templateUrl: partial('events/detail.html'),
                    controller: 'EventDetailStateCtrl'
                }
            }
        })
        // Files
        .state('files', {
            url: '/files',
            templateUrl: partial('files/files.html')
        })
        .state('team', {
            url: '/team',
            templateUrl: partial('team/team.html'),
            controller: 'TeamStateCtrl'
        })
        ;
});

app.controller('AppCtrl', function($scope, NavFilterService, UserRepository) {
    // Get current user
    UserRepository.getCurrentUser()
        .success(function(user) {
            $scope.currentUser = user[0];
            
            // Initialize NavFilter to show current user/team
            NavFilterService.setTeam(user[0].teams[0]);
        });
        
    $scope.toggleSidebar = function() {
        $scope.showSidebar = !$scope.showSidebar;
    };
        
    $scope.showSidebar = true;
});

app.controller('NavFilterCtrl', function($scope, NavFilterService, TeamRepository, UserRepository) {
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

        $scope.activeTeam = team;
    };

    var setUser = function(user) {
        $scope.activeUser = user;
    };
    
    // Select team click handler
    $scope.selectTeam = function($event, team) {
        NavFilterService.setTeam(team);
    };

    // Select user click handler
    $scope.selectUser = function($event, user) {
        NavFilterService.setUser(user);
    };
    
    // Listen to team/user changes from NavFilterService
    $scope.$on('navFilterTeamChanged', function() {
        setTeam(NavFilterService.team);
    });
    $scope.$on('navFilterUserChanged', function() {
        setUser(NavFilterService.user);
    });
    
    $scope.activeTeam = null;
    $scope.activeUser = null;
});

app.directive('timeFromNow', function($interval) {
    return {
        restrict: 'E',
        scope: {
            time: '='
        },
        templateUrl: 'components/time-from-now.html',
        link: function(scope, element, attrs) {
            var mTime = moment(scope.time);
            scope.isoTime = mTime.toISOString();
            
            var update = function() {
                scope.fromNow = mTime.fromNow();
            };

            // Update every minute
            var timeoutId = $interval(update, 60*1000);
            update();

            element.on('$destroy', function() {
                $interval.cancel(timeoutId);
            });
        }
    };
});
