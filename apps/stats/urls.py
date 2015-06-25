from django.conf.urls import patterns, include, url
from rest_framework import routers

from .views import *

router = routers.DefaultRouter()
router.register(r'team-daily', DailyTeamStatsViewset)

urlpatterns = patterns('',
    url(r'^tasks/$', TaskStatsView.as_view(), name='task-stats'),

    url(r'', include(router.urls)),
)
