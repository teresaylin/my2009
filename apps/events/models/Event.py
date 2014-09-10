from datetime import datetime, timedelta

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

from apps.users.models import CommentThread

class Event(models.Model):
    class Meta:
        app_label = 'events'

    title = models.CharField(max_length=100)
    owner = models.ForeignKey(User, related_name='events_owned')
    start = models.DateTimeField()
    end = models.DateTimeField()
    location = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    comment_thread = models.OneToOneField(CommentThread)

    attendees = models.ManyToManyField(User, through='EventAttendee')
    
    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Create comment thread if it doesn't exist
        if not self.comment_thread_id:
            thread = CommentThread.objects.create()
            self.comment_thread = thread
            
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Delete comment thread
        self.comment_thread.delete()
        return super().delete(*args, **kwargs)