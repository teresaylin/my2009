from rest_framework import serializers

from apps.users.serializers import UserSerializer

from ..models import Event

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ('id', 'title', 'owner', 'start', 'end', 'location', 'description', 'comment_thread', 'attendees')
        read_only_fields = ('comment_thread',)
    
    owner = UserSerializer(read_only=True)
    attendees = UserSerializer(read_only=True)