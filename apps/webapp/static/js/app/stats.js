var stats = angular.module('stats', [
    'googlechart'
]);

stats.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('stats', {
            url: '/stats',
            templateUrl: partial('stats/stats.html')
        })
        .state('stats.teamOverview', {
            url: '/team-overview',
            views: {
                '@': {
                    templateUrl: partial('stats/team-overview.html'),
                    controller: 'StatsTeamOverviewStateCtrl'
                }
            }
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
        getDailyTeamStats: function(teamId) {
            return $http.get(baseUrl+'team-daily/', { params: {
                team: teamId
            }});
        }
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

stats.controller('StatsTeamOverviewStateCtrl', function($scope, StatsService, NavFilterService) {
    function initChart() {
        $scope.chartReady = false;
        $scope.chartObject = {
            "type": "AnnotationChart",
            "displayed": true,
            "data": {
                "cols": [
                    {
                    "id": "date",
                    "label": "Date",
                    "type": "date",
                    "p": {}
                    },
                    {
                    "id": "tasksOpen",
                    "label": "Open Tasks",
                    "type": "number",
                    "p": {}
                    },
                    {
                    "id": "eventsScheduled",
                    "label": "Events scheduled",
                    "type": "number",
                    "p": {}
                    }
                ],
                "rows": []
            },
            "options": {
                "fill": 20,
                "displayExactValues": true,
                "hAxis": {
                    "title": "Date"
                }
            },
            "formatters": {}
        }
    }

    var addRow = function(date, tasksOpen, eventsScheduled) {
        $scope.chartObject.data.rows.push({
            c: [
                { v: date },
                { v: tasksOpen },
                { v: eventsScheduled }
            ]
        });
    }

    var update = function() {
        if(!NavFilterService.team) return;

        $scope.team = NavFilterService.team;

        // Clear chart and retrieve new set of data
        initChart();
        StatsService.getDailyTeamStats(NavFilterService.team.id)
            .success(function(data) {
                angular.forEach(data, function(stat) {
                    addRow(new Date(stat.date), stat.tasksOpen, stat.eventsScheduled);
                });
                $scope.chartReady = true;
            });
    }

    // Watch for nav filter team changes
    $scope.$on('navFilterChanged', function(event, changed) {
        if('team' in changed) {
            update();
        }
    });
    update();
});
