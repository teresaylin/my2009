from rest_framework import serializers

from apps.users.serializers import UserSerializer

from ..models import Event

class EventSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Event
        fields = ('url', 'id', 'title', 'owner', 'start', 'end', 'location', 'description', 'attendees')
    
    owner = UserSerializer(read_only=True)
    attendees = UserSerializer()