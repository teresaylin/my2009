from rest_framework import viewsets

from ..models import DailyTaskForceStats
from ..serializers import DailyTaskForceStatsSerializer

class DailyTaskForceStatsViewset(viewsets.ReadOnlyModelViewSet):
    queryset = DailyTaskForceStats.objects.all()
    serializer_class = DailyTaskForceStatsSerializer
    filter_fields = ('taskforce',)
    ordering = ('date',)
    permission_classes = ()
