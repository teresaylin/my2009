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
        list: function(id) {
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
        // Homepage
        .state('home', {
            url: '/',
            templateUrl: partial('home.html'),
            controller: function($scope, TaskRepository) {
                // Get list of all tasks
                TaskRepository.list()
                    .success(function(tasks) {
                        $scope.userTasks = tasks.results;
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
        .state('task', {
            abstract: true,
            url: '/task'
        })
        .state('task.detail', {
            url: '/:taskId',
            views: {
                '@': {
                    templateUrl: partial('task/detail.html'),
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
        ;
});

app.controller('AppCtrl', function($scope, UserRepository) {
    // Get current user
    UserRepository.getCurrentUser()
        .success(function(user) {
            $scope.currentUser = user.results[0];
        });
});
