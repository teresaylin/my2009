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

module.controller('EventDialogCtrl', function($scope, $modalInstance, EventRepository, EventDialogService, event) {
    var changesMade = false; // This is set when an event is created/edited
    
    var loadEvent = function(eventData) {
        $scope.event = eventData;
        $scope.creating = false;
        $scope.editing = false;
        
        $scope.event.date = new Date($scope.event.start).toISOString();
        $scope.event.start = new Date($scope.event.start).toISOString();
        $scope.event.end = new Date($scope.event.end).toISOString();
    };
    
    var newEvent = function() {
        var now = moment();
        $scope.event = {
            // Initialize start and end times
            date: now.toISOString(),
            start: now.clone(),
            end: now.clone().add(1, 'hours')
        };
        $scope.creating = true;
        $scope.editing = true;
    };
    
    if(event) {
        // Opening existing event
        loadEvent(angular.copy(event));
    } else {
        // Creating new event
        newEvent();
    }
    
    // Updates the 'start' and 'end' fields with the date
    var setStartEndDate = function() {
        var date = new Date($scope.event.date);
        var start = new Date($scope.event.start);
        var end = new Date($scope.event.end);
        
        start.setDate(date.getDate());
        start.setMonth(date.getMonth());
        start.setFullYear(date.getFullYear());
        
        end.setDate(date.getDate());
        end.setMonth(date.getMonth());
        end.setFullYear(date.getFullYear());
        
        $scope.event.start = start;
        $scope.event.end = end;
    };
    
    $scope.edit = function() {
        $scope.editing = true;
    };
    
    $scope.create = function(form) {
        setStartEndDate();
        
        // Create event
        EventRepository.create($scope.event)
            .success(function(data) {
                changesMade = true;
                // Refresh event with returned data
                loadEvent(data);
                form.$setPristine();
            });
    };

    $scope.update = function(form) {
        setStartEndDate();
        
        // Update event
        EventRepository.update($scope.event.id, $scope.event)
            .success(function(data) {
                changesMade = true;
                // Refresh event with returned data
                loadEvent(data);
                form.$setPristine();
            });
    };
    
    $scope.delete = function() {
        // Open delete event dialog
        EventDialogService.deleteEvent(event).result
            .then(function(deleted) {
                if(deleted) {
                    $modalInstance.close(true);
                }
            });
    };

    $scope.cancel = function() {
        $modalInstance.close(changesMade);
    };
        
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

module.factory('EventDialogService', function($modal) {
    return {
        openEvent: function(event) {
            var modal = $modal.open({
                templateUrl: partial('events/event-dialog.html'),
                controller: 'EventDialogCtrl',
                resolve: {
                    event: function() {
                        return event;
                    }
                }
            });
            
            return modal;
        },
        newEvent: function() {
            return this.openEvent(null);
        },
        deleteEvent: function(event) {
            var modal = $modal.open({
                templateUrl: partial('events/delete-dialog.html'),
                controller: function($scope, $modalInstance, EventRepository, event) {
                    $scope.event = event;
                    
                    $scope.delete = function() {
                        // Delete event
                        EventRepository.delete($scope.event.id)
                            .success(function() {
                                $modalInstance.close(true);
                            });
                    };
                    
                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                },
                resolve: {
                    event: function() {
                        return event;
                    }
                }
            });
            
            return modal;
        }
    };
});

module.controller('CalendarCtrl', function($scope, $modal, $state, EventRepository, EventDialogService) {
    $scope.eventsSource = function(start, end, timezone, callback) {
        // Get events within date range
        var query = {
            start: start.toJSON(),
            end: end.toJSON()
        };
        EventRepository.list(query)
            .success(function(events) {
                callback(events);
            });
    };

    // Event click handler
    var onEventClick = function(event, allDay, jsEvent, view){
        var dlg = EventDialogService.openEvent(event);

        dlg.result.then(function(changesMade) {
            if(changesMade) {
                // Reload events
                $scope.calendar.fullCalendar('refetchEvents');
            }
        });
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
    
    $scope.newEvent = function() {
        var dlg = EventDialogService.newEvent();

        dlg.result.then(function(changesMade) {
            if(changesMade) {
                // Reload events
                $scope.calendar.fullCalendar('refetchEvents');
            }
        });
    };
});
