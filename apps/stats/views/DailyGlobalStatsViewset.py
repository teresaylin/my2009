from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from ..models import DailyGlobalStats
from ..serializers import DailyGlobalStatsSerializer

class DailyGlobalStatsViewset(viewsets.ReadOnlyModelViewSet):
    queryset = DailyGlobalStats.objects.all()
    serializer_class = DailyGlobalStatsSerializer
    ordering = ('date',)
    permission_classes = (IsAdminUser,)
