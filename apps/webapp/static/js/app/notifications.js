module.controller('NotificationsController', function($scope, $rootScope, $timeout, NotificationRepository) {
    var timeoutDelay = 60*1000; // Update every 60 seconds
    var timeoutPromise = null;

    var update = function() {
        $scope.loading = true;

        // Get unread notifications
        NotificationRepository.list({ unread: true })
            .success(function(data) {
                $scope.unreadNts = data;
            })
            .finally(function() {
                $scope.loading = false;

                // Set timeout for next update
                timeoutPromise = $timeout(update, timeoutDelay);
            });
    }
    update();

    $scope.$on('$destroy', function() {
        if(timeoutPromise) {
            $timeout.cancel(timeoutPromise);
        }
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
                function linkUser(id, name) {
                    return '<a ui-sref="users.detail({ userId: '+id+' })">'+name+'</a>';
                }
                function linkTask(id, name) {
                    return '<a ng-click="openTask('+id+')">'+name+'</a>';
                }
                function linkEvent(id, name) {
                    return '<a ng-click="openEvent('+id+')">'+name+'</a>';
                }

                var text = '<span class="text-danger"><strong>???</strong></span>';
                switch(nt.verb) {
                    case 'assigned':
                        text = 'You have been assigned to task '+linkTask(nt.target_object_id, nt.target)+
                            ' <span class="text-muted">(by '+linkUser(nt.actor_object_id, nt.actor)+')</span>';
                        break;

                    case 'invited':
                        text = 'You have been invited to event '+linkEvent(nt.target_object_id, nt.target)+
                            ' <span class="text-muted">(by '+linkUser(nt.actor_object_id, nt.actor)+')</span>';
                        break;

                    case 'added':
                        text = 'You have been added to taskforce <em>'+nt.target+'</em>'+
                            ' <span class="text-muted">(by '+linkUser(nt.actor_object_id, nt.actor)+')</span>';
                        break;
                }

                el.html(text);
                $compile(el.contents())(scope);
            });
        }
    }
});
