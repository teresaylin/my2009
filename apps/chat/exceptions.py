from rest_framework.exceptions import APIException

class RoomAlreadyHasUser(APIException):
    status_code = 400
    default_detail = 'User is already in the room'
