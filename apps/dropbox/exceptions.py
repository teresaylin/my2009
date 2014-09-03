from rest_framework.exceptions import APIException

class DropboxUnauthorized(APIException):
    status_code = 401
    default_detail = 'Invalid or non-existent Dropbox user credentials'
    
class DropboxFileNotFound(APIException):
    status_code = 404
    default_detail = 'File not found'