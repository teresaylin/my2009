from rest_framework.exceptions import APIException

class UserNotFound(APIException):
    status_code = 404
    default_detail = 'User not found'

class TaskForceNotFound(APIException):
    status_code = 404
    default_detail = 'Task force not found'