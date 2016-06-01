from datetime import datetime

from django.utils.timezone import utc
from rest_framework import viewsets
from rest_framework.exceptions import ParseError, PermissionDenied

from libs.permissions.user_permissions import getUserObjectPermissions
from ..models import RoomUser
from ..serializers import RoomUserSerializer

class RoomUserViewSet(viewsets.ModelViewSet):
    queryset = RoomUser.objects.all()
    filter_fields = ('user',)
    serializer_class = RoomUserSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()

        # Optimizations
        queryset = queryset \
            .select_related('user')

        return queryset

    def pre_save(self, obj):
        # Verify request user has update permission on room
        roomPerms = getUserObjectPermissions(self.request.user, obj.room)
        if not roomPerms['update']:
            raise PermissionDenied()

        # Verify target user is a member of the team
        if not obj.user.teams.filter(pk=obj.room.team.pk).exists():
            raise PermissionDenied()

    def post_save(self, obj, created=False):
        pass
