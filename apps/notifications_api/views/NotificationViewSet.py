from rest_framework import viewsets
from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.response import Response

from notifications.models import Notification
from django_rt.views import RtResourceView

from ..serializers import NotificationSerializer

class NotificationViewSet(RtResourceView, mixins.RetrieveModelMixin, mixins.DestroyModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    ordering = '-timestamp'

    def get_queryset(self):
        queryset = super().get_queryset()

        # Only show current user's notifications
        queryset = queryset.filter(recipient=self.request.user)

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

    def rt_get_permission(self, action, request):
        return request.user.is_authenticated()

    def rt_get_channel(self, request):
        return '%s$%d' % (self.rt_get_path(request), request.user.id)
