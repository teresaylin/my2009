from rest_framework import serializers
from libs.permissions.serializers import ObjectPermissionsSerializerMixin

from ..models import Room, RoomUser
from .RoomUserSerializer import RoomUserSerializer

class RoomSerializer(ObjectPermissionsSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ('name', 'team', 'title', 'room_users')

    room_users = RoomUserSerializer(read_only=True, source='roomuser_set')
