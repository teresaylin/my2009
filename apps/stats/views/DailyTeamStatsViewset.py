from rest_framework import viewsets

from ..models import DailyTeamStats
from ..serializers import DailyTeamStatsSerializer

class DailyTeamStatsViewset(viewsets.ReadOnlyModelViewSet):
    queryset = DailyTeamStats.objects.all()
    serializer_class = DailyTeamStatsSerializer
    filter_fields = ('team',)
    ordering = ('date',)
    permission_classes = ()
