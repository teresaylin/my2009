var module = angular.module('repositories', []);

module.factory('EventRepository', function($http) {
    var baseUrl = '/api/events';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function(params) {
            return $http.get(baseUrl, { params: params });
        },
        create: function(data) {
            return $http.post(baseUrl+'/', data);
        },
        addAttendee: function(id, userId) {
            return $http.post(baseUrl+'/'+id+'/add_attendee/', {
                'user_id': userId
            });
        }
    };
});

module.factory('FileRepository', function($http) {
    var baseUrl = '/api/files';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        delete: function(id) {
            return $http.delete(baseUrl+'/'+id);
        },
        createSubdirectory: function(id, name) {
            return $http.post(baseUrl+'/'+id+'/create_subdirectory/', {
                'name': name
            });
        },
        getFileShare: function(id) {
            return $http.get(baseUrl+'/'+id+'/share');
        }
    };
});

module.factory('MilestoneRepository', function($http) {
    var baseUrl = '/api/milestones';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function(params) {
            return $http.get(baseUrl, { params: params });
        }
    };
});

module.factory('TaskRepository', function($http) {
    var baseUrl = '/api/tasks';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function() {
            return $http.get(baseUrl);
        },
        create: function(data) {
            return $http.post(baseUrl+'/', data);
        },
        update: function(id, data) {
            return $http.put(baseUrl+'/'+id, data);
        },
        delete: function(id) {
            return $http.delete(baseUrl+'/'+id);
        }
    };
});

module.factory('TaskForceRepository', function($http) {
    var baseUrl = '/api/taskforces';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function(params) {
            return $http.get(baseUrl, { params: params });
        },
        create: function(data) {
            return $http.post(baseUrl+'/', data);
        },
        update: function(id, data) {
            return $http.put(baseUrl+'/'+id, data);
        },
        delete: function(id) {
            return $http.delete(baseUrl+'/'+id);
        }
    };
});

module.factory('TeamRepository', function($http) {
    var baseUrl = '/api/teams';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function() {
            return $http.get(baseUrl);
        }
    };
});

module.factory('UserRepository', function($http) {
    var baseUrl = '/api/users';
    var profilesUrl = '/api/user-profiles';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        getCurrentUser: function() {
            return $http.get(baseUrl+'/?current');
        },
        list: function(params) {
            return $http.get(baseUrl, { params: params });
        },
        updateProfile: function(id, data) {
            return $http.put(profilesUrl+'/'+id, data);
        }
    };
});