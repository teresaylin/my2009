from datetime import datetime, timedelta

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Event(models.Model):
    class Meta:
        app_label = 'events'

    title = models.CharField(max_length=100)
    owner = models.ForeignKey(User, related_name='events_owned')
    start = models.DateTimeField()
    end = models.DateTimeField()
    location = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    attendees = models.ManyToManyField(User, through='EventAttendee')
    
    def __str__(self):
        return self.title