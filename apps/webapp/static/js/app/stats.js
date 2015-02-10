var stats = angular.module('stats', []);

stats.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('stats', {
            url: '/stats',
            abstract: true
        })
        .state('stats.tasks', {
            url: '/tasks',
            views: {
                '@': {
                    templateUrl: partial('stats/tasks.html'),
                    controller: 'StatsTasksStateCtrl'
                }
            }
        })
        ;
});

stats.factory('StatsService', function($http) {
    var baseUrl = '/api/stats/';
    
    return {
        getTaskStats: function(id) {
            return $http.get(baseUrl+'tasks/');
        },
    };
});

stats.directive('progressProportional', function() {
    return {
        restrict: 'E',
        scope: {
            value: '=value',
            total: '=total'
        },
        link: function(scope, el, attrs) {
            scope.$watchCollection('[value, total]', function(vals) {
                if(scope.total == 0) {
                    scope.valuePct = 0;
                    scope.remainPct = 100;
                } else {
                    scope.valuePct = Number(scope.value / scope.total * 100.0).toFixed(2);
                    scope.remainPct = Number(100.0 - scope.valuePct).toFixed(2);
                    scope.remain = scope.total - scope.value;
                }
            });
        },
        templateUrl: 'components/progress-proportional.html'
    };
});

stats.controller('StatsTasksStateCtrl', function($scope, StatsService) {
    StatsService.getTaskStats()
        .success(function(data) {
            $scope.stats = data;
        });
});
