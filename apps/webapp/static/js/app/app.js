var app = angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'ui.calendar',
    
    'dropbox'
]);

// App configuration
app.config(function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});

app.factory('EventRepository', function($http) {
    var baseUrl = '/api/events';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function(params) {
            return $http.get(baseUrl, { params: params });
        }
    };
});

app.factory('FileRepository', function($http) {
    var baseUrl = '/api/files';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
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

app.factory('NavFilterService', function($rootScope) {
    return {
        team: null,

        setTeam: function(team) {
            this.team = team;
            $rootScope.$broadcast('navFilterTeamChanged', team);
        }
    };
});

var partial = function(partial) {
    return '/static/partials/'+partial;
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

app.controller('NavFilterCtrl', function($scope, NavFilterService, TeamRepository, UserRepository) {
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

        // Notify service of team change
        NavFilterService.setTeam(team);
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

app.controller('FilesListCtrl', function($scope, $modal, FileRepository) {

    $scope.init = function(rootDirId) {
        $scope.rootDirId = rootDirId;
        $scope.setDirectory(rootDirId);
    };

    $scope.setDirectory = function(id) {
        // Retrieve directory listing
        FileRepository.get(id)
            .success(function(dir) {
                $scope.directory = dir;
            });
    };
        
    // Called when user clicks a file/directory
    $scope.openFile = function(file) {
        if(file.is_directory) {
            $scope.setDirectory(file.id);
        }
    };
    
    $scope.openUploadDialog = function() {
        var modal = $modal.open({
            templateUrl: partial('dropbox/upload-dialog.html'),
            controller: function($scope, $modalInstance, DropboxService) {
                // Set current path
                $scope.setPath = function(path) {
                    $scope.path = path;
                    $scope.numFilesSelected = 0;

                    // Retrieve metadata
                    DropboxService.getMetadata($scope.path)
                        .success(function(data) {
                            $scope.metadata = data;
                        });
                };
                
                // Move up a directory
                $scope.upDir = function() {
                    var path = $scope.path;
                    path = path.substr(0, path.lastIndexOf('/'));
                    if(path == '') path = '/';
                    $scope.setPath(path);
                };
                
                // Toggle file selected state
                $scope.toggleSelect = function(file) {
                    // Can't select directories
                    if(file.is_dir) return;
                    
                    // Toggle selection
                    var selected = 'selected' in file ? file.selected : false;
                    if(selected) {
                        file.selected = false;
                        $scope.numFilesSelected--;
                    } else {
                        file.selected = true;
                        $scope.numFilesSelected++;
                    }
                };
                
                $scope.upload = function() {
                };

                $scope.done = function() {
                    $modalInstance.close();
                };
                
                $scope.numFilesSelected = 0;
                $scope.setPath('/');
            }
        });
        
        modal.result.then(function() {
        });
    };
});

app.controller('CalendarCtrl', function($scope, $modal, EventRepository) {
    $scope.eventsSource = function(start, end, timezone, callback) {
        // Get events within date range
        var query = {
            start: start.toJSON(),
            end: end.toJSON()
        };
        EventRepository.list(query)
            .success(function(events) {
                // Iterate events
                angular.forEach(events, function(event) {
                    delete event.url;
                    //event.editable = true;
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
                $scope.ok = function(form) {
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