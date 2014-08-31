from rest_framework import serializers

from ..models import Event

class EventSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Event
        fields = ('url', 'title', 'owner', 'start', 'end', 'description')