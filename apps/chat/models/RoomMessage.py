from django.db import models
from django.contrib.auth.models import User

from libs.softdelete.models import SoftDeleteableModel

from .Room import Room

class RoomMessage(SoftDeleteableModel):
    class Meta:
        app_label = 'chat'

    JOIN = 'join'
    PART = 'part'
    MSG = 'msg'
    TYPES = (
        (JOIN,      'Join'),
        (PART,      'Part'),
        (MSG,       'Message'),
    )

    room = models.ForeignKey(Room, db_index=True)
    time = models.DateTimeField()
    user = models.ForeignKey(User, related_name='chat_messages')
    msg_type = models.CharField(max_length=4, choices=TYPES)
    content = models.TextField(max_length=200)

    def __str__(self):
        return '%s | [%s] <%s> %s: %s' % (self.room, self.time, self.user, self.msg_type, self.content)
