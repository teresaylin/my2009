var app = angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'ui.indeterminate',
    'ui.calendar',
    
    'chat',
    'customFilter',
    'events',
    'files',
    'navfilter',
    'notifications',
    'repositories',
    'tasks',
    'users',
    
    'stats'
]);

app.factory('HttpErrorInterceptor', function($q, $rootScope) {
    return {
        'responseError': function(response) {
            if(!response.config.errorsHandled ||
               !_.contains(response.config.errorsHandled, response.status)
            ) {
                if(response.status >= 400) {
                    $rootScope.$broadcast('serverError', response);
                }
            }

            return $q.reject(response);
        }
    };
});

// App configuration
app.config(function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        
    $httpProvider.interceptors.push('HttpErrorInterceptor');
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
            controller: 'DashboardCtrl'
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

app.controller('AppCtrl', function($rootScope, $scope, $modal, NavFilterService, UserRepository, CourseRepository) {
    $scope.$on('serverError', function(ev, response) {
        var modal = $modal.open({
            backdrop: 'static',
            templateUrl: 'error-dialog.html',
            controller: function($scope, $modalInstance) {
                $scope.errorText = 'Received '+response.status+' HTTP error';
                
                var cType = response.headers('Content-Type');
                if(cType == 'text/html') {
                    $scope.errorDetailHtml = response.data;
                } else if(cType == 'application/json' && 'detail' in response.data) {
                    $scope.errorDetail = response.data.detail;
                }
                
                $scope.close = function() {
                    $modalInstance.close();
                };
            }
        });
    });

    $scope.$on('navFilterChanged', function(event, changed) {
        if('team' in changed) {
            $scope.teamColor = NavFilterService.team.color;
            $scope.navTeam = NavFilterService.team;
        }
        if('user' in changed || 'taskforce' in changed) {
            $scope.navUser = NavFilterService.user;
            $scope.navTaskforce = NavFilterService.taskforce;
        }
    });

    // Get current user
    UserRepository.getCurrentUser()
        .success(function(data) {
            var user = data[0];
            $rootScope.currentUser = user;

            // Get active course (assume first course that the user has access to for now)
            CourseRepository.list().success(function(data) {
                var course = data[0];
                user.activeCourse = course;

                $rootScope.$broadcast('gotCurrentUser', user);
            });
        });
        
    $scope.toggleSidebar = function() {
        $scope.showSidebar = !$scope.showSidebar;
    };
        
    $scope.showSidebar = true;
});

app.controller('DashboardCtrl', function($scope, TaskDialogService, CustomFilterDialogService, UserSettingRepository) {
    $scope.newTask = function() {
        var dlg = TaskDialogService.newTask();
    };

    $scope.calendarFilterModel = {};
    $scope.tasksFilterModel = {};

    $scope.openCustomizeCalendar = function() {
        CustomFilterDialogService.open($scope.calendarFilterModel).result
            .then(function(data) {
                $scope.calendarFilterModel = data;

                // Save calendar filter
                UserSettingRepository.set('dashboard.calendarFilter', {
                    version: 1,
                    value: angular.toJson(data)
                });
            });
    };

    $scope.openCustomizeTasks = function() {
        CustomFilterDialogService.open($scope.tasksFilterModel).result
            .then(function(data) {
                $scope.tasksFilterModel = data;

                // Save tasks filter
                UserSettingRepository.set('dashboard.tasksFilter', {
                    version: 1,
                    value: angular.toJson(data)
                });
            });
    };

    // Get calendar filter settings
    $scope.loadingCalendar = true;
    UserSettingRepository.get('dashboard.calendarFilter', { errorsHandled: [404] })
        .then(function(response) {
            $scope.calendarFilterModel = angular.fromJson(response.data.value);
        }, function(response) {
            if(response.status == 404) {
                // User doesn't have a filter set up
                $scope.calendarFilterModel = {};
            }
        })
        .finally(function() {
            $scope.loadingCalendar = false;
        });

    // Get task list filter settings
    $scope.loadingTasks = true;
    UserSettingRepository.get('dashboard.tasksFilter', { errorsHandled: [404] })
        .then(function(response) {
            $scope.tasksFilterModel = angular.fromJson(response.data.value);
        }, function(response) {
            if(response.status == 404) {
                // User doesn't have a filter set up
                $scope.tasksFilterModel = {};
            }
        })
        .finally(function() {
            $scope.loadingTasks = false;
        });
});

app.controller('NavCtrl', function($scope) {
    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
        $scope.stateName = toState.name;
    });
});

app.controller('TeamMembersListCtrl', function($scope, $timeout, NavFilterService, UserRepository) {
    var timeoutDelay = 60*1000; // Update every 60 seconds
    var timeoutPromise = null;

    var update = function() {
        if(NavFilterService.team) {
            // Get team members
            UserRepository.list({ teams: NavFilterService.team.id })
                .success(function(data) {
                    $scope.users = data;

                    // Set timeout for next update
                    timeoutPromise = $timeout(update, timeoutDelay);
                });
        } else {
            // Set timeout for next update
            timeoutPromise = $timeout(update, timeoutDelay);
        }
    };
    update();
    
    $scope.$on('$destroy', function() {
        if(timeoutPromise) {
            $timeout.cancel(timeoutPromise);
        }
    });

    $scope.$on('navFilterChanged', function(ev, changed) {
        if('team' in changed && NavFilterService.team) {
            // Cancel timeout and force update
            $timeout.cancel(timeoutPromise);
            update();
        }
    });
    
    $scope.userFilter = {
        is_online: true
    };
    $scope.showAll = false;
    
    $scope.more = function() {
        delete $scope.userFilter.is_online;
        $scope.showAll = true;
    };

    $scope.less = function() {
        $scope.userFilter.is_online = true;
        $scope.showAll = false;
    };
});

app.directive('timeFromNow', function($interval) {
    return {
        restrict: 'E',
        scope: {
            time: '=',
            timeFormat: '='
        },
        templateUrl: 'components/time-from-now.html',
        link: function(scope, element, attrs) {
            var mTime = null;
            var timeoutId = null;
            
            scope.$watch('time', function(time) {
                if(time) {
                    // Convert time to Moment object and ISO string
                    if('timeFormat' in attrs && attrs.timeFormat == 'rfc2822') {
                        // Note: JS Date constructor can accept RFC 2822 date strings, according to MDN.
                        mTime = moment(new Date(scope.time));
                    } else {
                        mTime = moment(scope.time);
                    }
                    scope.isoTime = mTime.toISOString();

                    // Cancel existing timeout if it exists
                    if(timeoutId) {
                        $interval.cancel(timeoutId);
                    }
                    
                    // Update every minute
                    timeoutId = $interval(update, 60*1000);
                    update();
                }
            });
            
            var update = function() {
                scope.fromNow = mTime.fromNow();
            };

            element.on('$destroy', function() {
                if(timeoutId) {
                    $interval.cancel(timeoutId);
                }
            });
        }
    };
});

app.directive('ngSrcdoc', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            scope.$parent.$watch(attrs.ngSrcdoc, function(val) {
                var doc = element[0].contentWindow.document;
                doc.open('text/html', 'replace');
                doc.write(val);
                doc.close();
            });
        }
    };
});

app.directive('spinner', function() {
    return {
        restrict: 'E',
        templateUrl: 'components/spinner.html'
    }
});
