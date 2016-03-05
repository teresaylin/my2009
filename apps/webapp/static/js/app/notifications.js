var module = angular.module('notifications', []);

module.factory('NotificationsUpdateService', function($rootScope, NotificationRepository) {
    var evtSource = null;

    var open = function() {
        if(evtSource) return;

        evtSource = new EventSource(NotificationRepository.getRtUrl(), { withCredentials: true });
        evtSource.addEventListener('notification', function(e) {
            var evt = JSON.parse(e.data);
            $rootScope.$broadcast('userNotification', evt.data);
        });
    };

    var close = function() {
        if(evtSource) {
            evtSource.close();
        }
    };

    return {
        listen: function() {
            open();
        }
    };
});

module.controller('NotificationsController', function($scope, $rootScope, $timeout, NotificationRepository, NotificationsUpdateService) {
    // Listen for new notifications
    NotificationsUpdateService.listen();

    var update = function() {
        $scope.loading = true;

        // Get unread notifications
        NotificationRepository.list({ unread: true })
            .success(function(data) {
                $scope.unreadNts = data;
            })
            .finally(function() {
                $scope.loading = false;
            });
    }
    update();

    $scope.$on('$destroy', function() {
    });

    $scope.$on('userNotification', function(evt, nt) {
        // Receive new notification
        $scope.$apply(function() {
            $scope.unreadNts.unshift(nt);
        });
    });

    $scope.$on('userNotificationRead', function(evt, nt) {
        if(!$scope.unreadNts) return;

        // Remove notification from unread list
        $scope.unreadNts = _.reject($scope.unreadNts, function(obj) {
            return obj.id == nt.id;
        });
    });

    $scope.markRead = function(notification) {
        NotificationRepository.markRead(notification.id)
            .success(function() {
                notification.unread = false;
                $rootScope.$broadcast('userNotificationRead', notification);
            });
    }

    $scope.markUnread = function(notification) {
        NotificationRepository.markUnread(notification.id)
            .success(function() {
                notification.unread = true;
            });
    }

    $scope.more = function(count) {
        // Get read notifications
        NotificationRepository.list({ read: true })
            .success(function(data) {
                $scope.readNts = data;
            })
            .finally(function() {
                $scope.loading = false;
            });
    }
});

module.directive('notificationText', function($compile, TaskRepository, TaskDialogService, EventRepository, EventDialogService) {
    return {
        restrict: 'A',
        scope: {
            notificationText: '='
        },
        link: function(scope, el, attrs) {
            scope.openTask = function(id) {
                TaskRepository.get(id)
                    .success(function(task) {
                        TaskDialogService.openTask(task);
                    });
            };

            scope.openEvent = function(id) {
                EventRepository.get(id)
                    .success(function(event) {
                        EventDialogService.openEvent(event);
                    });
            };

            scope.$watch('notificationText', function(nt) {
                var linkFuncs = {
                    event: function (id, name) {
                        return '<a ng-click="openEvent('+id+')">'+name+'</a>';
                    },
                    task: function(id, name) {
                        return '<a ng-click="openTask('+id+')">'+name+'</a>';
                    },
                    user: function(id, name) {
                        return '<a ui-sref="users.detail({ userId: '+id+' })">'+name+'</a>';
                    },
                    _unknown: function(id, name) {
                        return '<i>'+name+'</i>';
                    }
                };

                function showTarget() {
                    var ct = nt.target_content_type;
                    var linkFunc = ct in linkFuncs ? linkFuncs[ct] : linkFuncs._unknown;
                    return ct+' '+linkFunc(nt.target_object_id, nt.target);
                }

                function byActor() {
                    // Add (by "user") text
                    if(nt.actor_object_id) {
                        return ' <span class="text-muted">(by '+linkFuncs.user(nt.actor_object_id, nt.actor)+')</span>';
                    } else {
                        return '';
                    }
                }

                var text = '<span class="text-danger"><strong>???</strong></span>';
                switch(nt.verb) {
                    case 'assigned':
                        text = 'You have been assigned to '+showTarget();
                        text += byActor();
                        break;

                    case 'invited':
                        text = 'You have been invited to '+showTarget();
                        text += byActor();
                        break;

                    case 'added':
                        text = 'You have been added to '+showTarget();
                        text += byActor();
                        break;

                    case 'commented':
                        text = linkFuncs.user(nt.actor_object_id, nt.actor)+' commented on '+showTarget();
                        break;
                }

                el.html(text);
                $compile(el.contents())(scope);
            });
        }
    }
});
