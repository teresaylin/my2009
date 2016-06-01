from rest_framework import serializers

from ..models import RoomUser
from apps.users.serializers import UserSerializer

class RoomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomUser
        fields = ('room', 'user', 'status')

    room = serializers.SlugRelatedField(slug_field='name')
    user = UserSerializer(read_only=True)
