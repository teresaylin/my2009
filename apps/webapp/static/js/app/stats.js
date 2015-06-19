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

stats.controller('StatsTeamOverviewStateCtrl', function($scope, StatsService) {
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
            "id": "tasks",
            "label": "Tasks",
            "type": "number",
            "p": {}
            },
            {
            "id": "files",
            "label": "Files",
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

    var addRow = function(date, tasks, files) {
        $scope.chartObject.data.rows.push({
            c: [
                { v: date },
                { v: tasks },
                { v: files }
            ]
        });
    }

    var date = new Date(2015, 1, 1);
    for(var i = 0; i < 365; i++) {
        addRow(new Date(date), parseInt((Math.random() * 100).toFixed(0)), parseInt((Math.random() * 100).toFixed(0)));
        date.setDate(date.getDate() + 1);
    }
});
