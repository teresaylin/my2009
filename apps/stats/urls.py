from django.conf.urls import patterns, include, url

from .views import *

urlpatterns = patterns('',
    url(r'^tasks/$', TaskStatsView.as_view(), name='task-stats'),
)
