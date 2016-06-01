from django.db import models
from django.contrib.auth.models import User

from libs.softdelete.models import SoftDeleteableModel

class RoomUser(models.Model):
    class Meta:
        app_label = 'chat'
        unique_together = ('room', 'user')

    USER = 'user'
    OPER = 'oper'
    STATUSES = (
        (USER, 'User'),
        (OPER, 'Operator'),
    )

    room = models.ForeignKey('Room')
    user = models.ForeignKey(User)
    status = models.CharField(max_length=4, choices=STATUSES, default=USER)

    def __str__(self):
        return '%s -> %s' % (self.user, self.room)
