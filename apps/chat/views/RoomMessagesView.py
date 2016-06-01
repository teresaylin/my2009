from django.core.urlresolvers import resolve
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ParseError
from rest_framework.permissions import IsAdminUser
from django_rt.views import RtResourceView

from ..models import Room

class RoomMessagesView(RtResourceView, APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request, roomName=None):
        room = get_object_or_404(Room, name=roomName)
        self.check_object_permissions(self.request, room)

        return Response({})

    def rt_get_permission(self, action, request):
        # Get Room
        match = resolve(request.path)
        roomName = match.kwargs['roomName']
        room = get_object_or_404(Room, name=roomName)

        # Check permissions
        try:
            self.check_object_permissions(self.request, room)
            return True
        except e:
            return False
