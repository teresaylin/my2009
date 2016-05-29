from rest_framework import serializers

from ..models import RoomMessage

class RoomMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomMessage
        fields = ('room', 'time', 'msg_type', 'user', 'user_fullname', 'content')
        read_only_fields = ('time', 'user')

    room = serializers.SlugRelatedField(slug_field='name')
    user_fullname = serializers.SerializerMethodField('getUserFullname')

    def getUserFullname(self, obj):
        return '%s %s' % (obj.user.first_name, obj.user.last_name)
