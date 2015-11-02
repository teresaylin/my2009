var module = angular.module('customFilter', []);

module.factory('CustomFilterDialogService', function($modal) {
    return {
        open: function(model) {
            var modal = $modal.open({
                backdrop: 'static',
                templateUrl: partial('components/custom-filter.html'),
                controller: 'CustomFilterDialogCtrl',
                resolve: {
                    model: function() {
                        return model;
                    },
                }
            });
            
            return modal;
        }
    };
});

module.controller('CustomFilterDialogCtrl', function($modalInstance, $scope, $rootScope, UserRepository, TaskForceRepository, model) {
    function updateTeamCheckbox(team) {
        team._selected =
            (team._allUsersSelected === false &&
            team._allTfsSelected === false &&
            team._currentUser._selected === false) ?
                false : null;
    }

    function selectAllTfDescendants(tf, selected) {
        if('children' in tf) {
            angular.forEach(tf.children, function(child) {
                child._selected = selected;
                selectAllTfDescendants(child, selected);
            });
        }
    }

    function serialize() {
        // Translate selection to JS object
        var data = {};
        angular.forEach($scope.teams, function(team) {
            var teamData = {};
            if(team._selected) {
                // Full team selected
                teamData = team.id;
            } else {
                if(team._currentUser._selected) {
                    teamData.currentUser = true;
                }

                if(team._allUsersSelected) {
                    teamData.users = 'all';
                } else {
                    var userArray = _.pluck(_.where(team.users, { _selected: true }), 'id');
                    if(userArray.length > 0) {
                        teamData.users = userArray;
                    }
                }

                if(team._allTfsSelected) {
                    teamData.taskforces = 'all';
                } else {
                    function processTfList(tfs) {
                        var tfObj = {};
                        angular.forEach(tfs, function(tf) {
                            if(tf._selected === true) {
                                tfObj[tf.id] = true;
                            } else if (tf._selected === null) {
                                // Partial taskforce selection
                                tfObj[tf.id] = processTfList(tf.children);
                            }
                        });
                        return tfObj;
                    }

                    var tfObj = processTfList(team.taskforces);
                    if(!_.isEmpty(tfObj)) {
                        teamData.taskforces = tfObj;
                    }
                }
            }

            if(!(_.isObject(teamData) && _.isEmpty(teamData))) {
                teamData.id = team.id;

                if(!('teams' in data)) data.teams = [];
                data.teams.push(teamData);
            }
        });

        return data;
    }

    // Initialize tree
    $scope.teams = angular.copy($rootScope.currentUser.teams);
    angular.forEach($scope.teams, function(team) {
        team._currentUser = angular.copy($rootScope.currentUser);

        team._selected = false;
        team._allUsersSelected = false;
        team._allTfsSelected = false;
        team._currentUser._selected = false;

        // Read model
        if('teams' in model) {
            angular.forEach(model.teams, function(modelTeam) {
                if(modelTeam === team.id) {
                    // Whole team selected
                    team._selected = true;
                    team._allUsersSelected = true;
                    team._allTfsSelected = true;
                    team._currentUser._selected = true;
                } else if(_.isObject(modelTeam) && modelTeam.id == team.id) {
                    // Team partially selected
                    team._selected = null;
                    if('currentUser' in modelTeam) {
                        team._currentUser._selected = modelTeam.currentUser;
                    }

                    if('users' in modelTeam) {
                        if(modelTeam.users === 'all') {
                            // All users selected
                            team._allUsersSelected = true;
                        } else {
                            // Partial users selected. User selection is handled in getUsers()
                            team._allUsersSelected = null;
                        }
                    }

                    if('taskforces' in modelTeam) {
                        if(modelTeam.taskforces === 'all') {
                            // All taskforces selected
                            team._allTfsSelected = true;
                        } else {
                            // Partial taskforces selected. Taskforce selection is handled in getTaskforces()
                            team._allTfsSelected = null;
                        }
                    }
                } else {
                    // Team not selected at all
                }
            });
        }
    });

    $scope.close = function() {
        $modalInstance.dismiss('cancel');
    };

    $scope.ok = function() {
        var data = serialize();
        $modalInstance.close(data);
    }

    $scope.getUsers = function(team) {
        if('users' in team) return;

        // Get team members
        return UserRepository.list({ teams: team.id })
            .success(function(data) {
                // Remove current user from user list
                team.users = _.reject(data, { id: $scope.currentUser.id });

                angular.forEach(team.users, function(user) {
                    if(team._allUsersSelected) {
                        user._selected = true;
                    } else if(team._allUsersSelected === null) {
                        // Partial user selection. Read selection from model.
                        if('teams' in model) {
                            var modelTeam = _.findWhere(model.teams, function(obj) {
                                return _.isObject(obj) && obj.id == team.id;
                            });
                            user._selected = _.contains(modelTeam.users, user.id);
                        }
                    } else {
                        user._selected = false;
                    }
                });
            });
    };

    function selectTfFromModel(tf) {
        if('_filterModel' in tf) {
            if(tf._filterModel === true || (tf.parent && tf.parent._selected === true)) {
                tf._selected = true;
            } else if(_.isObject(tf._filterModel)) {
                tf._selected = null;

                if('children' in tf) {
                    angular.forEach(tf.children, function(child) {
                        selectTfFromModel(child);
                    });
                }
            }
        } else {
            tf._selected = false;
        }
    }

    $scope.getTaskforces = function(team) {
        if('taskforces' in team) return;

        // Get root task forces
        return TaskForceRepository.list({
            team: team.id,
            root: true
        })
            .success(function(data) {
                team.taskforces = data;

                angular.forEach(team.taskforces, function(tf) {
                    tf.parent = null;

                    if('teams' in model) {
                        var modelTeam = _.findWhere(model.teams, function(obj) {
                            return _.isObject(obj) && obj.id == team.id;
                        });

                        // Add reference to filter model
                        if(_.isObject(modelTeam.taskforces) && tf.id in modelTeam.taskforces) {
                            tf._filterModel = modelTeam.taskforces[tf.id];
                        }
                    }


                    // Add parent and filter model reference to children
                    if('children' in tf) {
                        angular.forEach(tf.children, function(child) {
                            child.parent = tf;

                            if(_.isObject(tf._filterModel) && child.id in tf._filterModel) {
                                child._filterModel = tf._filterModel[child.id];
                            }
                        });
                    }

                    if(team._allTfsSelected === true) {
                        tf._selected = true;
                    } else if(team._allTfsSelected === false) {
                        tf._selected = false;
                    } else {
                        selectTfFromModel(tf);
                    }
                    
                    if(tf._selected === true || tf._selected === false) {
                        selectAllTfDescendants(tf, tf._selected);
                    }
                });
            });
    };

    $scope.getChildTaskforces = function(parentTf) {
        if('children' in parentTf) return;

        // Get parent task force
        return TaskForceRepository.get(parentTf.id)
            .success(function(data) {
                parentTf.children = data.children;

                angular.forEach(parentTf.children, function(tf) {
                    // Add parent and filter model reference to children
                    angular.forEach(parentTf.children, function(child) {
                        child.parent = parentTf;

                        if(_.isObject(parentTf._filterModel) && child.id in parentTf._filterModel) {
                            child._filterModel = parentTf._filterModel[child.id];
                        }
                    });

                    if(parentTf._selected === true) {
                        tf._selected = true;
                    } else if(parentTf._allTfsSelected === false) {
                        tf._selected = false;
                    } else {
                        selectTfFromModel(tf);
                    }

                    if(tf._selected === true || tf._selected === false) {
                        selectAllTfDescendants(tf, tf._selected);
                    }
                });
            });
    }

    $scope.selectAllUsers = function(team) {
        if('users' in team) {
            angular.forEach(team.users, function(user) {
                user._selected = team._allUsersSelected;
            });
        }
        
        updateTeamCheckbox(team);
    };

    $scope.onSelectUser = function(team, user) {
        // Set "all users" checkbox to indeterminate state if one or more users selected
        team._allUsersSelected =
            _.countBy(team.users, { _selected: true })['true'] > 0 ? null : false;

        updateTeamCheckbox(team);
    }

    $scope.onSelectCurrentUser = function(team) {
        updateTeamCheckbox(team);
    }

    $scope.selectAllTfs = function(team) {
        if('taskforces' in team) {
            angular.forEach(team.taskforces, function(tf) {
                tf._selected = team._allTfsSelected;
                selectAllTfDescendants(tf, team._allTfsSelected);
            });
        }

        updateTeamCheckbox(team);
    };

    $scope.onSelectTf = function(team, tf) {
        // Select all descendents
        selectAllTfDescendants(tf, tf._selected);

        // Propagate selection state to ancestors
        function propagate(tf) {
            if(tf) {
                var childrenSelected = _.filter(tf.children, function(obj) {
                    return obj._selected === true || obj._selected === null;
                }).length > 0;

                // Set taskforce checkbox to indeterminate state if one or more taskforces selected
                tf._selected = childrenSelected ? null : false;
                
                propagate(tf.parent);
            } else {
                var childrenSelected = _.filter(team.taskforces, function(obj) {
                    return obj._selected === true || obj._selected === null;
                }).length > 0;

                // Set "all taskforces" checkbox to indeterminate state if one or more taskforces selected
                team._allTfsSelected = childrenSelected ? null : false;
            }
        }
        propagate(tf.parent);

        updateTeamCheckbox(team);
    }

    $scope.onSelectTeam = function(team) {
        team._allUsersSelected = team._allTfsSelected = team._selected;
        team._currentUser._selected = team._selected;

        if('taskforces' in team) {
            angular.forEach(team.taskforces, function(tf) {
                tf._selected = team._allTfsSelected;
                selectAllTfDescendants(tf, team._allTfsSelected);
            });
        }
    }
});
