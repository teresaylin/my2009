from rest_framework import serializers

from ..models import DailyTeamStats

class DailyTeamStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyTeamStats
        fields = ('team', 'date', 'tasksOpen', 'eventsScheduled', 'dropboxFiles')
