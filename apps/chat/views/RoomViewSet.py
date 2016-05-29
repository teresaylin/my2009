from datetime import datetime

from django.utils.timezone import utc
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.db import IntegrityError
from notifications import notify

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from django_rt.publish import publish

from apps.users.exceptions import UserNotInTeam, UserNotFound, TaskForceNotFound
from apps.users.models import TaskForce

from ..exceptions import RoomAlreadyHasUser
from ..models import Room, RoomUser, RoomMessage
from ..serializers import RoomSerializer, RoomMessageSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    lookup_field = 'name'
    serializer_class = RoomSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()

        # Optimizations
        queryset = queryset \
            .prefetch_related('users')

        return queryset

    def pre_save(self, obj):
        if not obj.pk:
            # Set owner
            obj.owner = self.request.user

        # Check user belongs to team (accept if user is superuser)
        if not self.request.user.is_superuser and not obj.team in self.request.user.teams.all():
            raise UserNotInTeam()

    def post_save(self, obj, created=False):
        if created:
            # Add owner to room with operator status
            RoomUser.objects.create(
                room=obj,
                user=obj.owner,
                status=RoomUser.OPER
            )

    def _publish_msg(self, msg):
        # Publish message event
        serializer = RoomMessageSerializer(msg)
        channel = reverse('chat:room-messages', kwargs={ 'roomName': msg.room.name })
        publish(channel,
            event_type='message',
            data=serializer.data
        )


    def _join(self, user):
        room = self.get_object()

        # Create RoomUser object
        try:
            RoomUser.objects.create(
                room=room,
                user=user
            )
        except IntegrityError:
            raise RoomAlreadyHasUser()

        # Post join message to room
        msg = RoomMessage.objects.create(
            room=room,
            time=datetime.utcnow().replace(tzinfo=utc),
            user=user,
            msg_type=RoomMessage.JOIN,
            content='has joined the room'
        )
        self._publish_msg(msg)

        if user != self.request.user:
            # Generate notification for added user
            notify.send(self.request.user,
                recipient=user,
                verb='added',
                action_object=user,
                target=room,
                description='You have been added to a room'
            )

    def _part(self, roomUser):
        room = self.get_object()

        # Post part message to room
        msg = RoomMessage.objects.create(
            room=room,
            time=datetime.utcnow().replace(tzinfo=utc),
            user=roomUser.user,
            msg_type=RoomMessage.PART,
            content='has left the room'
        )
        self._publish_msg(msg)

        # Remove RoomUser object
        roomUser.delete()

    @action(methods=['PUT'])
    def add_user(self, request, name=None):
        # Get User object
        try:
            userId = request.DATA.get('user_id', None)
            user = User.objects.get(id=userId)
        except User.DoesNotExist:
            raise UserNotFound()
        
        self._join(user)
        
        return Response({})

    @action(methods=['PUT'])
    def add_taskforce(self, request, name=None):
        room = self.get_object()
        
        # Get TaskForce object
        try:
            taskforceId = request.DATA.get('taskforce_id', None)
            taskforce = TaskForce.objects.get(id=taskforceId)
        except TaskForce.DoesNotExist:
            raise TaskForceNotFound()
        
        # Add all members to room
        for user in taskforce.members.all():
            try:
                self._join(user)
            except RoomAlreadyHasUser:
                # Ignore users already in the room
                pass
            
        # Return updated event
        return Response({})

    @action(methods=['PUT'])
    def remove_user(self, request, name=None):
        room = self.get_object()
        
        # Get RoomUser object
        try:
            userId = request.DATA.get('user_id', None)
            roomUser = RoomUser.objects.get(room=room, user__id=userId)
        except RoomUser.DoesNotExist:
            raise UserNotFound()

        self._part(roomUser)
        
        return Response({})

    @action(methods=['GET'])
    def part(self, request, name=None):
        room = self.get_object()
        
        # Get RoomUser object
        try:
            roomUser = RoomUser.objects.get(room=room, user=request.user)
        except RoomUser.DoesNotExist:
            raise UserNotFound()

        self._part(roomUser)

        return Response({})
