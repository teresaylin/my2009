var chat = angular.module('chat', []);

chat.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('chat', {
            url: '/chat',
            templateUrl: partial('chat/chat.html'),
            controller: 'ChatStateCtrl'
        })
        .state('chat.room', {
            url: '/room/:name',
            views: {
                '@': {
                    templateUrl: partial('chat/room.html'),
                    controller: 'ChatRoomStateCtrl'
                }
            }
        })
        ;
});

chat.factory('ChatRoomRepository', function($http) {
    var baseUrl = '/api/chat/rooms/';
    
    return {
        get: function(name) {
            return $http.get(baseUrl+name+'/');
        },
        update: function(name, data) {
            return $http.put(baseUrl+name+'/', data);
        },
        delete: function(name) {
            return $http.delete(baseUrl+name+'/');
        },
        create: function(room) {
            return $http.post(baseUrl, room);
        },
        list: function(params) {
            return $http.get(baseUrl, { params: params });
        },
        getMessagesUrl: function(roomName) {
            return baseUrl+roomName+'/messages/.sse';
        },
        part: function(roomName) {
            return $http.get(baseUrl+roomName+'/part/');
        },
        addUser: function(roomName, userId) {
            return $http.put(baseUrl+roomName+'/add_user/', {
                'user_id': userId
            });
        },
        addTaskforce: function(roomName, taskforceId) {
            return $http.put(baseUrl+roomName+'/add_taskforce/', {
                'taskforce_id': taskforceId
            });
        },
        removeUser: function(roomName, userId) {
            return $http.put(baseUrl+roomName+'/remove_user/', {
                'user_id': userId
            });
        }
    };
});

chat.factory('ChatMessageRepository', function($http) {
    var baseUrl = '/api/chat/messages/';
    
    return {
        list: function(params) {
            return $http.get(baseUrl, { params: params });
        },
        create: function(msg) {
            return $http.post(baseUrl, msg);
        },
    };
});

chat.controller('ChatStateCtrl', function($scope, NavFilterService, ChatRoomRepository, ChatDialogService) {
    // Get nav filter team
    var navTeam = NavFilterService.team;
    $scope.$on('navFilterChanged', function(event, changed) {
        if('team' in changed) {
            navTeam = NavFilterService.team;
            getRoomList();
        }
    });

    function getRoomList() {
        if(!navTeam) return;

        // Get room list
        ChatRoomRepository.list({ team: navTeam.id })
            .success(function(data) {
                $scope.rooms = data;
            });
    }
    getRoomList();

    $scope.newRoom = function() {
        ChatDialogService.newRoom()
            .result.then(function() {
                getRoomList();
            });
    }

    $scope.partRoom = function(room) {
        ChatDialogService.partRoom(room)
            .result.then(function() {
                getRoomList();
            });
    };

    $scope.editRoom = function(room) {
        ChatDialogService.openRoom(room)      
            .result.then(function() {
                getRoomList();
            });
    };

    $scope.deleteRoom = function(room) {
        ChatDialogService.deleteRoom(room)      
            .result.then(function() {
                getRoomList();
            });
    };
});

chat.controller('ChatRoomStateCtrl', function($scope, $stateParams, $modal, ChatRoomRepository, ChatMessageRepository, ChatDialogService) {
    var roomName = $stateParams.name;
    var evtSource = null;

    function processNewMsg(msg) {
        // Add msg to list
        $scope.messages.push(msg);

        if(msg.msg_type == 'join' || msg.msg_type == 'part') {
            // Refresh user list
            updateRoom();
        }
    }

    function updateRoom() {
        return ChatRoomRepository.get(roomName)
            .success(function(data) {
                $scope.room = data;
            });
    }

    // Get room data
    updateRoom().then(function() {
        // Get messages
        ChatMessageRepository.list({ room: roomName })
            .success(function(data) {
                $scope.messages = data;

                // Listen for new messages
                var url = ChatRoomRepository.getMessagesUrl($scope.room.name);
                evtSource = new EventSource(url, { withCredentials: true });
                evtSource.addEventListener('message', function(e) {
                    var evt = JSON.parse(e.data);
                    var msg = evt.data;

                    $scope.$apply(function() {
                        processNewMsg(msg);
                    });
                });
            });
    });

    $scope.postMessage = function(content) {
        var msg = {
            room: roomName,
            content: content,
            msg_type: 'msg'
        };
        ChatMessageRepository.create(msg);
    };

    $scope.addUser = function(user) {
        ChatRoomRepository.addUser($scope.room.name, user.id);
    };

    $scope.addTaskforce = function(taskforce) {
        ChatRoomRepository.addTaskforce($scope.room.name, taskforce.id);
    };

    $scope.removeUser = function(user) {
        var modal = $modal.open({
            backdrop: 'static',
            templateUrl: partial('chat/remove-user.html'),
            controller: function($scope, $modalInstance, ChatRoomRepository, room, user) {
                $scope.room = room;
                $scope.user = user;

                $scope.remove = function() {
                    $modalInstance.close();
                }

                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };
            },
            resolve: {
                room: function() { return $scope.room; },
                user: function() { return user; }
            }
        });

        modal.result.then(function() {
            ChatRoomRepository.removeUser($scope.room.name, user.id);
        });
    };

    $scope.$on('chatRoomUpdated', function(evt, room) {
        if(room.name == $scope.room.name) {
            $scope.room = room;
        }
    });

    $scope.$on('$destroy', function() {
        // Close SSE source
        if(evtSource) {
            evtSource.close();
        }
    });
});

chat.filter('roomName', function() {
    return function(name) {
        return '#'+name;
    }
});

chat.factory('ChatDialogService', function($modal) {
    return {
        openRoom: function(room) {
            var modal = $modal.open({
                backdrop: 'static',
                templateUrl: partial('chat/room-dialog.html'),
                controller: function($rootScope, $scope, $modalInstance, ChatRoomRepository, NavFilterService, room) {
                    $scope.creating = !room;
                    $scope.room = angular.copy(room) || {};

                    $scope.create = function(form) {
                        $scope.room.team = NavFilterService.team.id;

                        // Create room
                        ChatRoomRepository.create($scope.room)
                            .success(function(data) {
                                $rootScope.$broadcast('chatRoomCreated', data);
                                $modalInstance.close();
                            });
                    };

                    $scope.update = function(form) {
                        // Update room
                        ChatRoomRepository.update($scope.room.name, $scope.room)
                            .success(function(data) {
                                $rootScope.$broadcast('chatRoomUpdated', data);
                                $modalInstance.close();
                            });
                    };

                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                },
                resolve: {
                    room: function() {
                        return room;
                    }
                }
            });
            
            return modal;
        },
        newRoom: function(parent) {
            return this.openRoom(null);
        },
        deleteRoom: function(room) {
            var modal = $modal.open({
                backdrop: 'static',
                templateUrl: partial('chat/delete-room-dialog.html'),
                controller: function($rootScope, $scope, $modalInstance, ChatRoomRepository, room) {
                    $scope.room = room;
                    
                    $scope.delete = function() {
                        // Delete room
                        ChatRoomRepository.delete($scope.room.name)
                            .success(function() {
                                $rootScope.$broadcast('chatRoomDeleted', $scope.room);
                                $modalInstance.close(true);
                            });
                    };
                    
                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                },
                resolve: {
                    room: function() { return room; }
                }
            });
            
            return modal;
        },
        partRoom: function(room) {
            var modal = $modal.open({
                backdrop: 'static',
                templateUrl: partial('chat/part-room-dialog.html'),
                controller: function($rootScope, $scope, $modalInstance, ChatRoomRepository, room) {
                    $scope.room = room;
                    
                    $scope.part = function() {
                        // Part room
                        ChatRoomRepository.part($scope.room.name)
                            .success(function() {
                                $modalInstance.close(true);
                            });
                    };
                    
                    $scope.cancel = function() {
                        $modalInstance.dismiss('cancel');
                    };
                },
                resolve: {
                    room: function() { return room; }
                }
            });
            
            return modal;
        }
    };
});
