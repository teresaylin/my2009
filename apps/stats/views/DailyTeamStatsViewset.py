from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from ..models import DailyTeamStats
from ..serializers import DailyTeamStatsSerializer

class DailyTeamStatsViewset(viewsets.ReadOnlyModelViewSet):
    queryset = DailyTeamStats.objects.all()
    serializer_class = DailyTeamStatsSerializer
    filter_fields = ('team',)
    ordering = ('date',)
    permission_classes = (IsAdminUser,)
