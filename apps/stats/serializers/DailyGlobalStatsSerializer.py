from rest_framework import serializers

from ..models import DailyGlobalStats

class DailyGlobalStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyGlobalStats
        fields = ('date', 'tasksOpen', 'eventsScheduled', 'dropboxFiles')
