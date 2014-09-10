var app = angular.module('app', [
    'ui.router',
    'ui.bootstrap',
    'ui.calendar',
    
    'dropbox',
    'files',
    'repositories'
]);

// App configuration
app.config(function($httpProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});

app.factory('NavFilterService', function($rootScope) {
    return {
        team: null,
        user: null,

        setTeam: function(team) {
            this.team = team;
            $rootScope.$broadcast('navFilterTeamChanged', team);
        },
        setUser: function(user) {
            this.user = user;
            $rootScope.$broadcast('navFilterUserChanged', user);
        }
    };
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
                // Get list of all tasks
                TaskRepository.list()
                    .success(function(tasks) {
                        $scope.userTasks = tasks;
                    });
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
                    controller: function($scope, $stateParams, $modal, UserRepository) {
                        // Get user
                        UserRepository.get($stateParams.userId)
                            .success(function(user) {
                                $scope.user = user;
                            });
                            
                        $scope.openEditProfileDialog = function() {
                            var modal = $modal.open({
                                templateUrl: partial('users/edit-profile-dialog.html'),
                                controller: function($scope, $modalInstance, user) {
                                    if(user.profile) {
                                        // Copy existing profile
                                        $scope.profile = angular.copy(user.profile);
                                    } else {
                                        // Create new profile
                                        $scope.profile = {};
                                    }
                                    
                                    $scope.ok = function(form) {
                                        // Update profile
                                        UserRepository.updateProfile(user.id, $scope.profile)
                                            .success(function() {
                                                $modalInstance.close($scope.profile);
                                            });
                                    };
                    
                                    $scope.cancel = function() {
                                        $modalInstance.dismiss('cancel');
                                    };
                                },
                                resolve: {
                                    user: function() {
                                        return $scope.user;
                                    }
                                }
                            });
                            
                            modal.result.then(function(profile) {
                                // Add updated profile to user object
                                $scope.user.profile = profile;
                            });
                        };
                    }
                }
            }
        })
        // Tasks
        .state('tasks', {
            url: '/tasks',
            templateUrl: partial('tasks/tasks.html'),
            controller: function($scope, $modal, TaskRepository) {
                var refreshTasks = function() {
                    // Get list of all tasks
                    TaskRepository.list()
                        .success(function(tasks) {
                            $scope.tasks = tasks;
                        });
                };
                refreshTasks();

                // Create/update a task
                $scope.openEditTaskDialog = function(task) {
                    var modal = $modal.open({
                        templateUrl: partial('tasks/edit-dialog.html'),
                        controller: function($scope, $modalInstance, TaskRepository) {
                            if(task) {
                                // Editing existing task
                                $scope.creating = false;
                                $scope.task = angular.copy(task);
                            } else {
                                // Creating new task
                                $scope.creating = true;
                                $scope.task = {
                                    order: 0
                                };
                            }
                            
                            $scope.create = function(form) {
                                // Create task
                                TaskRepository.create($scope.task)
                                    .success(function() {
                                        $modalInstance.close();
                                    });
                            };
                            
                            $scope.update = function(form) {
                                // Update task
                                TaskRepository.update($scope.task.id, $scope.task)
                                    .success(function() {
                                        // Overwrite original object with updated object
                                        angular.copy($scope.task, task);
                                        $modalInstance.close();
                                    });
                            };
            
                            $scope.cancel = function() {
                                $modalInstance.dismiss('cancel');
                            };
                        }
                    });
                    
                    modal.result.then(function() {
                        // Refresh tasks list if new task has been created
                        if(!task) {
                            refreshTasks();
                        }
                    });
                };

                // Delete task 
                $scope.openDeleteTaskDialog = function(task) {
                    var modal = $modal.open({
                        templateUrl: partial('tasks/delete-task-dialog.html'),
                        controller: function($scope, $modalInstance, TaskRepository) {
                            $scope.task = task;
                            
                            $scope.delete = function(form) {
                                // Delete task
                                TaskRepository.delete(task.id)
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
                        // Refresh tasks after deletion
                        refreshTasks();
                    });
                };
            }
        })
        .state('tasks.detail', {
            url: '/:taskId',
            views: {
                '@': {
                    templateUrl: partial('tasks/detail.html'),
                    controller: function($scope, $stateParams, TaskRepository) {
                        // Get task
                        TaskRepository.get($stateParams.taskId)
                            .success(function(task) {
                                $scope.task = task;
                            });
                            
                        $scope.addAssignedUser = function(user) {
                            TaskRepository.addAssignedUser($scope.task.id, user.id)
                                .success(function() {
                                    $scope.task.assigned_users.push(user);
                                });
                        };

                        $scope.removeAssignedUser = function(user) {
                            TaskRepository.removeAssignedUser($scope.task.id, user.id)
                                .success(function() {
                                    var assignedUsers = $scope.task.assigned_users;
                                    assignedUsers.splice(assignedUsers.indexOf(user), 1);
                                });
                        };

                        $scope.addAssignedTaskforce = function(taskforce) {
                            TaskRepository.addAssignedTaskforce($scope.task.id, taskforce.id)
                                .success(function() {
                                    $scope.task.assigned_taskforces.push(taskforce);
                                });
                        };

                        $scope.removeAssignedTaskforce = function(taskforce) {
                            TaskRepository.removeAssignedTaskforce($scope.task.id, taskforce.id)
                                .success(function() {
                                    var assignedTaskforces = $scope.task.assigned_taskforces;
                                    assignedTaskforces.splice(assignedTaskforces.indexOf(taskforce), 1);
                                });
                        };
                    }
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
                    controller: function($scope, $stateParams, EventRepository) {
                        // Get task
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
                    }
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
            controller: function($scope, $modal, NavFilterService, TeamRepository, UserRepository, TaskForceRepository) {
                var update = function() {
                    if(NavFilterService.team) {
                        $scope.team = NavFilterService.team;

                        // Get list of users in selected team
                        UserRepository.list({ teams: NavFilterService.team.id })
                            .success(function(users) {
                                $scope.users = users;
                            });
                        
                        // Get root task forces
                        TaskForceRepository.list({
                            team: NavFilterService.team.id,
                            root: true
                        })
                            .success(function(data) {
                                $scope.taskForces = data;
                            });
                    }
                };
                
                // Called when user opens a task force in the accordion
                $scope.getTaskForceChildren = function(taskForce) {
                    // Get taskForce children if they don't exist
                    if(!('children' in taskForce)) {
                        TaskForceRepository.get(taskForce.id)
                            .success(function(data) {
                                taskForce.children = data.children;
                            });
                    }
                };
                
                // Create/update a task force
                $scope.openEditTaskForceDialog = function(taskforce, parent) {
                    var modal = $modal.open({
                        templateUrl: partial('team/edit-taskforce-dialog.html'),
                        controller: function($scope, $modalInstance, TaskForceRepository, MilestoneRepository, team) {
                            
                            if(taskforce) {
                                // Editing existing taskforce
                                $scope.creating = false;
                                $scope.taskforce = angular.copy(taskforce);
                            } else {
                                // Creating new taskforce
                                $scope.creating = true;
                                $scope.taskforce = {
                                    milestone: null,
                                    team: team.id,
                                    parent_task_force: parent ? parent.id : null
                                };
                            }
                            
                            // Get list of all milestones
                            MilestoneRepository.list()
                                .success(function(data) {
                                    $scope.milestones = data;
                                    
                                    // Angular <select> detects the default selection by reference,
                                    // so replace the existing milestone object with the copy in the list.
                                    if($scope.taskforce.milestone) {
                                        angular.forEach(data, function(milestone) {
                                            if($scope.taskforce.milestone.id == milestone.id) {
                                                $scope.taskforce.milestone = milestone;
                                            }
                                        });
                                    }
                                });
                            
                            $scope.create = function(form) {
                                // Create task force
                                $scope.taskforce.milestone_id = $scope.taskforce.milestone.id;
                                TaskForceRepository.create($scope.taskforce)
                                    .success(function() {
                                        $modalInstance.close();
                                    });
                            };
                            
                            $scope.update = function(form) {
                                // Update task force
                                $scope.taskforce.milestone_id = $scope.taskforce.milestone.id;
                                TaskForceRepository.update($scope.taskforce.id, $scope.taskforce)
                                    .success(function() {
                                        // Overwrite original object with updated object
                                        angular.copy($scope.taskforce, taskforce);
                                        $modalInstance.close();
                                    });
                            };
            
                            $scope.cancel = function() {
                                $modalInstance.dismiss('cancel');
                            };
                        },
                        resolve: {
                            team: function() {
                                return $scope.team;
                            }
                        }
                    });
                    
                    modal.result.then(function() {
                        // If creating a new object
                        if(!taskforce) {
                            if(parent) {
                                // Refresh parent task force's children
                                TaskForceRepository.get(parent.id)
                                    .success(function(data) {
                                        parent.children = data.children;
                                    });
                            } else {
                                // No parent, refresh root task force list
                                update();
                            }
                        }
                    });
                };
                
                // Delete task force
                $scope.openDeleteTaskForceDialog = function(taskforce) {
                    var modal = $modal.open({
                        templateUrl: partial('team/delete-taskforce-dialog.html'),
                        controller: function($scope, $modalInstance, TaskForceRepository) {
                            $scope.taskforce = taskforce;
                            
                            $scope.delete = function(form) {
                                // Delete task force
                                TaskForceRepository.delete(taskforce.id)
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
                        var deletedId = taskforce.id;
                        
                        // Recursively scan task force tree and remove the deleted task force (urgh...)
                        var scan = function(taskforces) {
                            angular.forEach(taskforces, function(taskforce, idx) {
                                if(taskforce.id == deletedId) {
                                    taskforces.splice(idx, 1);
                                    return;
                                }
                                
                                if('children' in taskforce) {
                                    scan(taskforce.children);
                                }
                            });
                        };
                        scan($scope.taskForces);
                    });
                };
                
                $scope.addTaskForceMember = function(taskforce, user) {
                    TaskForceRepository.addMember(taskforce.id, user.id)
                        .success(function() {
                            taskforce.members.push(user);
                        });
                };

                $scope.removeTaskForceMember = function(taskforce, user) {
                    TaskForceRepository.removeMember(taskforce.id, user.id)
                        .success(function() {
                            taskforce.members.splice(taskforce.members.indexOf(user), 1);
                        });
                };

                // Update users when team changes
                $scope.$on('navFilterTeamChanged', function() {
                    update();
                });

                // Get users
                update();
            }
        })
        ;
});

app.controller('AppCtrl', function($scope, NavFilterService, UserRepository) {
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

app.controller('NavFilterCtrl', function($scope, NavFilterService, TeamRepository, UserRepository) {
    // Get list of all teams
    TeamRepository.list()
        .success(function(teams) {
            $scope.teams = teams;
        });    

    var setTeam = function(team) {
        // Check if the current user is in this team
        var userInTeam = false;
        angular.forEach($scope.currentUser.teams, function(userTeam) {
            if(team.id == userTeam.id) {
                userInTeam = true;
            }
        });
                
        // Update users list with only users in active team
        UserRepository.list({ teams: team.id })
            .success(function(users) {
                $scope.users = users;
                
                // Show current user if member of selected team, otherwise show the first member
                if(userInTeam) {
                    NavFilterService.setUser($scope.currentUser);
                } else {
                    NavFilterService.setUser(users[0]);
                }
            });

        $scope.activeTeam = team;
    };

    var setUser = function(user) {
        $scope.activeUser = user;
    };
    
    // Select team click handler
    $scope.selectTeam = function($event, team) {
        NavFilterService.setTeam(team);
    };

    // Select user click handler
    $scope.selectUser = function($event, user) {
        NavFilterService.setUser(user);
    };
    
    // Listen to team/user changes from NavFilterService
    $scope.$on('navFilterTeamChanged', function() {
        setTeam(NavFilterService.team);
    });
    $scope.$on('navFilterUserChanged', function() {
        setUser(NavFilterService.user);
    });
    
    $scope.activeTeam = null;
    $scope.activeUser = null;
});

app.controller('CalendarCtrl', function($scope, $modal, $state, EventRepository) {
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

app.directive('userPicture', function() {
    return {
        restrict: 'E',
        scope: {
            user: '=',
            size: '='
        },
        templateUrl: 'components/user-picture.html'
    };
});

app.directive('userPicker', function(UserRepository) {
    return {
        restrict: 'E',
        scope: {
            user: '=',
            restrictTeam: '='
        },
        templateUrl: 'components/user-picker.html',
        link: function(scope, element, attrs) {
            scope.search = function(q) {
                var params = {
                    search_name: q,
                    page_size: 10,
                };
                if(scope.restrictTeam) {
                    params.teams = scope.restrictTeam.id;
                }

                return UserRepository.list(params)
                    .then(function(res){
                        return res.data.results;
                    });
            };
        }
    };
});

app.directive('taskforcePicker', function(TaskForceRepository) {
    return {
        restrict: 'E',
        scope: {
            taskforce: '='
        },
        templateUrl: 'components/taskforce-picker.html',
        link: function(scope, element, attrs) {
            scope.search = function(q) {
                return TaskForceRepository.list({
                    search_name: q,
                    page_size: 10
                })
                    .then(function(res){
                        return res.data.results;
                    });
            };
        }
    };
});

app.directive('commentsSection', function($http, CommentRepository) {
    return {
        restrict: 'E',
        scope: {
        },
        templateUrl: 'components/comments-section.html',
        link: function(scope, element, attrs) {
            var threadId = null;

            scope.nextPageUrl = null;
            
            scope.$parent.$watch(attrs.threadId, function(val) {
                if(val) {
                    threadId = val;

                    // Get most recent comments
                    CommentRepository.list({
                        'thread': threadId,
                        'page_size': 10
                    })
                        .success(function(data) {
                            scope.comments = data.results;
                            scope.nextPageUrl = data.next;
                        });
                }
            });
            
            // Load older comments
            scope.more = function() {
                if(!scope.nextPageUrl) return;
                
                // Retrieve next page of comments and add to scope.comments
                $http.get(scope.nextPageUrl)
                    .success(function(data) {
                        Array.prototype.push.apply(scope.comments, data.results);
                        scope.nextPageUrl = data.next;
                    });
            };
            
            // Post comment from this user 
            scope.postComment = function(body) {
                var comment = {
                    'thread': threadId,
                    'body': body
                };

                CommentRepository.create(comment)
                    .success(function(newComment) {
                        scope.comments.unshift(newComment);
                    });
            };
        }
    };
});









