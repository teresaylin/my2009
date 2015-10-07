from rest_framework import serializers
from libs.permissions.serializers import ObjectPermissionsSerializerMixin

from apps.users.serializers import BasicUserSerializer, BasicTaskForceSerializer, TeamSerializer
from apps.files.serializers import FileAppDataUserPathField

from ..models import Event

class EventSerializer(ObjectPermissionsSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ('id', 'title', 'owner', 'team', 'start', 'end', 'is_global',
                  'location', 'description', 'comment_thread', 'attendees', 'attending_taskforces', 'files')
    
    owner = BasicUserSerializer(read_only=True)
    team = serializers.PrimaryKeyRelatedField()
    attendees = BasicUserSerializer(read_only=True)
    attending_taskforces = BasicTaskForceSerializer(read_only=True)

    files = FileAppDataUserPathField(many=True, read_only=True)

    comment_thread = serializers.SerializerMethodField('getCommentThread')
    def getCommentThread(self, obj):
        return str(obj.comment_thread.publicId)
