from rest_framework import serializers

from ..models import DailyUserStats

class DailyUserStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyUserStats
        fields = ('user', 'date', 'tasksOwned', 'tasksAssigned', 'eventsOwned', 'eventsAttending')
