var app = angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'ui.calendar',
    
    'dropbox',
    'events',
    'files',
    'navfilter',
    'repositories',
    'tasks',
    'users'
]);

app.factory('HttpErrorInterceptor', function($q, $rootScope) {
    return {
        'responseError': function(response) {
            if(response.status >= 400) {
                $rootScope.$broadcast('serverError', response);
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

app.controller('AppCtrl', function($scope, $modal, NavFilterService, UserRepository) {
    $scope.$on('serverError', function(ev, response) {
        var modal = $modal.open({
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
