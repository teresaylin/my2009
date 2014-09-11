var module = angular.module('events', []);

module.controller('EventDetailStateCtrl', function($scope, $stateParams, EventRepository) {
    // Get event
    EventRepository.get($stateParams.eventId)
        .success(function(event) {
            $scope.event = event;
        });
        
    $scope.addAttendee = function(user) {
        EventRepository.addAttendee($scope.event.id, user.id)
            .success(function() {
                $scope.event.attendees.push(user);
            });
    };

    $scope.removeAttendee = function(user) {
        EventRepository.removeAttendee($scope.event.id, user.id)
            .success(function() {
                var attendees = $scope.event.attendees;
                attendees.splice(attendees.indexOf(user), 1);
            });
    };
});

module.controller('CalendarCtrl', function($scope, $modal, $state, EventRepository) {
    $scope.eventsSource = function(start, end, timezone, callback) {
        // Get events within date range
        var query = {
            start: start.toJSON(),
            end: end.toJSON()
        };
        EventRepository.list(query)
            .success(function(events) {
                // Assign each event a URL
                angular.forEach(events, function(event) {
                    event.url = $state.href('events.detail', { eventId: event.id });
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
            timezone: 'local',
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

                // Create new event, default to now
                var defaultDate = moment();
                $scope.event = {
                    date: defaultDate.toISOString(),
                    start_time: defaultDate.clone(),
                    end_time: defaultDate.clone().add(1, 'hours')
                };
                
                $scope.ok = function(form) {
                    var date = new Date($scope.event.date);
                    var start = new Date($scope.event.start_time);
                    var end = new Date($scope.event.end_time);
                    
                    start.setDate(date.getDate());
                    start.setMonth(date.getMonth());
                    start.setFullYear(date.getFullYear());
                    
                    end.setDate(date.getDate());
                    end.setMonth(date.getMonth());
                    end.setFullYear(date.getFullYear());
                    
                    $scope.event.start = start;
                    $scope.event.end = end;
                    delete $scope.event.date;
                    delete $scope.event.start_time;
                    delete $scope.event.end_time;
                    
                    EventRepository.create($scope.event)
                        .success(function() {
                            $modalInstance.close();
                        });
                };

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            }
        });
        
        modal.result.then(function() {
            // Reload events
            $scope.calendar.fullCalendar('refetchEvents');
        });
    };
});
