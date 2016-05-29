from django.conf.urls import patterns, include, url
from rest_framework import routers

from .views import *

router = routers.DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'messages', RoomMessageViewSet)
router.register(r'room-users', RoomUserViewSet)

urlpatterns = [
    url(r'', include(router.urls)),

    url(r'^rooms/(?P<roomName>[-\w]+)/messages/$', RoomMessagesView.as_view(), name='room-messages'),
]
