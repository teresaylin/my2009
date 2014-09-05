var app = angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'ui.calendar',
    
    'dropbox',
    'files',
    'repositories'
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
                // Get list of all tasks
                TaskRepository.list()
                    .success(function(tasks) {
                        $scope.userTasks = tasks;
                    });
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
            templateUrl: partial('users/users.html'),
            controller: function($scope, $stateParams, NavFilterService, UserRepository) {
                var updateUsers = function() {
                    // Get list of users in selected team
                    if(NavFilterService.team) {
                        UserRepository.list({ teams: NavFilterService.team.id })
                            .success(function(users) {
                                $scope.users = users;
                            });
                    }
                };
                
                // Update users when team changes
                $scope.$on('navFilterTeamChanged', function() {
                    updateUsers();
                });

                // Get users
                updateUsers();
            }
        })
        .state('users.detail', {
            url: '/:userId',
            views: {
                '@': {
                    templateUrl: partial('users/detail.html'),
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
        .state('events.detail', {
            url: '/:eventId',
            views: {
                '@': {
                    templateUrl: partial('events/detail.html'),
                    controller: function($scope, $stateParams, EventRepository) {
                        // Get task
                        EventRepository.get($stateParams.eventId)
                            .success(function(event) {
                                $scope.event = event;
                            });
                    }
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
            controller: function($scope, NavFilterService, TeamRepository, TaskForceRepository) {
                var update = function() {
                    if(NavFilterService.team) {
                        $scope.team = NavFilterService.team;
                        
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
                
                // Update users when team changes
                $scope.$on('navFilterTeamChanged', function() {
                    update();
                });

                // Get users
                update();
            }
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

app.controller('CalendarCtrl', function($scope, $modal, $state, EventRepository) {
    $scope.eventsSource = function(start, end, timezone, callback) {
        // Get events within date range
        var query = {
            start: start.toJSON(),
            end: end.toJSON()
        };
        EventRepository.list(query)
            .success(function(events) {
                // Assign each event a URL
                angular.forEach(events, function(event) {
                    event.url = $state.href('events.detail', { eventId: event.id });
                });
                
                callback(events);
            });
    };

    // Event click handler
    var onEventClick = function(event, allDay, jsEvent, view){
    };

    // Event drag/drop handler
    var onEventDrop = function(event, delta, revertFunc, jsEvent, ui, view) {
    };

    // Event resize handler
    var onEventResize = function(event, delta, revertFunc, jsEvent, ui, view) {
    };

    // Calendar configuration
    $scope.uiConfig = {
        calendar: {
            height: 600,
            header: {
                left: 'agendaDay agendaWeek month',
                center: 'title',
                right: 'today prev,next'
            },
            timezone: 'local',
            eventClick: onEventClick,
            eventDrop: onEventDrop,
            eventResize: onEventResize,
        }
    };

    $scope.eventSources = [$scope.eventsSource];

    $scope.openEditDialog = function() {
        var modal = $modal.open({
            templateUrl: partial('events/edit-dialog.html'),
            controller: function($scope, $modalInstance) {
                $scope.event = {};
                
                $scope.ok = function(form) {
                    var date = $scope.event.date;
                    var start = $scope.event.start_time;
                    var end = $scope.event.end_time;
                    
                    start.setDate(date.getDate());
                    start.setMonth(date.getMonth());
                    start.setFullYear(date.getFullYear());
                    
                    end.setDate(date.getDate());
                    end.setMonth(date.getMonth());
                    end.setFullYear(date.getFullYear());
                    
                    $scope.event.start = start;
                    $scope.event.end = end;
                    delete $scope.event.date;
                    delete $scope.event.start_time;
                    delete $scope.event.end_time;
                    
                    EventRepository.create($scope.event)
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
        });
    };
});