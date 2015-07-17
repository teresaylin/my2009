from rest_framework import serializers

from ..models import DailyTaskForceStats

class DailyTaskForceStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyTaskForceStats
        fields = ('taskforce', 'date', 'tasksAssigned', 'eventsAttending')
