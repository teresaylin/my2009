var app = angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'ui.calendar'
]);

// App configuration
app.config(function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});

app.factory('DropboxService', function($http) {
    var baseUrl = '/dropbox';
    
    return {
        getStatus: function(id) {
            return $http.get(baseUrl+'/status');
        },
        requestAuthorization: function(id) {
            return $http.get(baseUrl+'/authorize');
        },
        finishAuthorization: function(authCode) {
            return $http.post(baseUrl+'/authorize', {
                'authorization_code': authCode
            });
        }
    };
});

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

var partial = function(partial) {
    return '/static/partials/'+partial;
}

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
        // Files
        .state('files', {
            url: '/files',
            templateUrl: partial('files/files.html')
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

app.controller('FilesListCtrl', function($scope) {
    $scope.files = [
        {
            type: 'directory',
            name: 'Folder of stuff',
            modifiedTime: (new Date()).toJSON(),
            size: 0
        },
        {
            type: 'pdf',
            name: 'Some Document.pdf',
            modifiedTime: (new Date()).toJSON(),
            size: 124654
        },
        {
            type: 'image',
            name: 'An image.jpeg',
            modifiedTime: (new Date()).toJSON(),
            size: 124654
        },
        {
            type: 'powerpoint',
            name: 'My Presentation.pptx',
            modifiedTime: (new Date()).toJSON(),
            size: 124654
        }
    ];
});

app.controller('DropboxAuthCtrl', function($scope, $modal, DropboxService) {
    // Get Dropbox status
    DropboxService.getStatus()
        .success(function(status) {
            $scope.status = status;
        });

    $scope.openAuthDialog = function() {
        var modal = $modal.open({
            templateUrl: partial('dropbox/auth-dialog.html'),
            controller: function($scope, $modalInstance, DropboxService) {
                // Get authorization URL
                DropboxService.requestAuthorization()
                    .success(function(data) {
                        $scope.authUrl = data.authorize_url;
                    });
                    
                $scope.codeChanged = function(form) {
                    // Reset invalidCode flag when code changes
                    form.code.$setValidity('invalidCode', true);
                };
                
                $scope.ok = function(form) {
                    // Finish authorization
                    DropboxService.finishAuthorization(form.authCode)
                        .success(function(data) {
                            // Auth successful
                            $modalInstance.close(true);
                        })
                        .error(function(data, status) {
                            // Invalid auth code
                            if(status == 400) {
                                form.code.$setValidity('invalidCode', false);
                            }
                        });
                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            }
        });
        
        modal.result.then(function(authorized) {
            // Refresh Dropbox status
            DropboxService.getStatus()
                .success(function(status) {
                    $scope.status = status;
                });
        });
    };
});

app.controller('CalendarCtrl', function($scope) {
    $scope.eventsSource = function(start, end, timezone, callback) {
        var events = [];
        
        events.push({
            title: 'Test event',
            start: start,
            end: start + 1000000,
            editable: true,
        });
        
        callback(events);
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
            eventClick: onEventClick,
            eventDrop: onEventDrop,
            eventResize: onEventResize,
        }
    };

    $scope.eventSources = [$scope.eventsSource];
});