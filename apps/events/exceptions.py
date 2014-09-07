from rest_framework.exceptions import APIException

class EventAlreadyHasAttendee(APIException):
    status_code = 400
    default_detail = 'User is already an attendee'