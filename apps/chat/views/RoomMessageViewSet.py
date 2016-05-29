from datetime import datetime

from django.utils.timezone import utc
from django.core.urlresolvers import reverse

from rest_framework import viewsets
from rest_framework.exceptions import ParseError, PermissionDenied

from django_rt.publish import publish

from ..models import RoomMessage
from ..serializers import RoomMessageSerializer

class RoomMessageViewSet(viewsets.ModelViewSet):
    queryset = RoomMessage.objects.all()
    serializer_class = RoomMessageSerializer
    ordering = 'time'
    
    def get_queryset(self):
        queryset = super().get_queryset()

        room = self.request.QUERY_PARAMS.get('room', None)
        if room is None:
            raise ParseError('"room" must be specified')
        queryset = queryset.filter(room__name=room)

        # Optimizations
        queryset = queryset \
            .select_related('user')

        return queryset

    def pre_save(self, obj):
        if obj.msg_type != RoomMessage.MSG:
            raise ParseError('msg_type must be %s' % RoomMessage.MSG)

        # Verify user is a member of the room
        if not obj.room.users.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied()

        # Set user
        obj.user = self.request.user

        # Set time to now
        obj.time = datetime.utcnow().replace(tzinfo=utc)

    def post_save(self, obj, created=False):
        if created:
            # Publish message event
            serializer = RoomMessageSerializer(obj)
            channel = reverse('chat:room-messages', kwargs={ 'roomName': obj.room.name })
            publish(channel,
                event_type='message',
                data=serializer.data
            )
