from rest_framework import viewsets
from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.response import Response

from notifications.models import Notification

from ..serializers import NotificationSerializer

class NotificationViewSet(mixins.RetrieveModelMixin, mixins.DestroyModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    ordering = '-timestamp'

    def get_queryset(self):
        queryset = super().get_queryset()

        unread = self.request.QUERY_PARAMS.get('unread', None)
        if unread:
            queryset = queryset.filter(unread=True)

        return queryset

    @action(methods=['PUT'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.unread = False
        notification.save()
        return Response({})

    @action(methods=['PUT'])
    def mark_unread(self, request, pk=None):
        notification = self.get_object()
        notification.unread = True
        notification.save()
        return Response({})
