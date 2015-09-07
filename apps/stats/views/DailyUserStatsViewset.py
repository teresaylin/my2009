from rest_framework import viewsets

from ..models import DailyUserStats
from ..serializers import DailyUserStatsSerializer

class DailyUserStatsViewset(viewsets.ReadOnlyModelViewSet):
    queryset = DailyUserStats.objects.all()
    serializer_class = DailyUserStatsSerializer
    filter_fields = ('user',)
    ordering = ('date',)
    permission_classes = ()
