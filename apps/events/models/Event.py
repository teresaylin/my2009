from datetime import datetime, timedelta

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Event(models.Model):
    class Meta:
        app_label = 'events'

    title = models.CharField(max_length=100)
    owner = models.ForeignKey(User)
    start = models.DateTimeField()
    end = models.DateTimeField()
    description = models.TextField()
    
    def __str__(self):
        return self.title