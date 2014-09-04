var module = angular.module('repositories', []);

module.factory('EventRepository', function($http) {
    var baseUrl = '/api/events';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function(params) {
            return $http.get(baseUrl, { params: params });
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

module.factory('TaskRepository', function($http) {
    var baseUrl = '/api/tasks';
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        list: function() {
            return $http.get(baseUrl);
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
    
    return {
        get: function(id) {
            return $http.get(baseUrl+'/'+id);
        },
        getCurrentUser: function() {
            return $http.get(baseUrl+'/?current');
        },
        list: function(params) {
            return $http.get(baseUrl, { params: params });
        }
    };
});