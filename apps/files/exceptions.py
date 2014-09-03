from rest_framework.exceptions import APIException

class FileIsNotADirectory(APIException):
    status_code = 400
    default_detail = 'File is not a directory'

class FileInvalidFilename(APIException):
    status_code = 400
    default_detail = 'Invalid filename'

class FileAlreadyExists(APIException):
    status_code = 400
    default_detail = 'File already exists'