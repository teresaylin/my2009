from django.db import models
from django.contrib.auth.models import User

from libs.softdelete.models import SoftDeleteableModel

from apps.users.models import Team
from .RoomUser import RoomUser

class Room(SoftDeleteableModel):
    class Meta:
        app_label = 'chat'

    name = models.SlugField(unique=True, max_length=50)
    team = models.ForeignKey(Team, related_name='chat_rooms')
    title = models.CharField(max_length=200)
    owner = models.ForeignKey(User, related_name='chat_rooms_owned')
    users = models.ManyToManyField(User, through=RoomUser, related_name='chat_rooms')

    def __str__(self):
        return '#'+self.name
