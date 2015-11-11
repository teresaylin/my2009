from datetime import datetime, timedelta

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

from libs.softdelete.models import SoftDeleteableModel
from apps.users.models import CommentThread, Team
from apps.files.models import FileAppData
from apps.users.models import TaskForce

class Event(SoftDeleteableModel):
    class Meta:
        app_label = 'events'

    title = models.CharField(max_length=100)
    owner = models.ForeignKey(User, related_name='events_owned')
    team = models.ForeignKey(Team, related_name='events', null=True, blank=True)
    start = models.DateTimeField()
    end = models.DateTimeField()
    is_global = models.BooleanField(default=False)
    location = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    comment_thread = models.OneToOneField(CommentThread, editable=False)

    attendees = models.ManyToManyField(User, through='EventAttendee', related_name='events_attending')
    attending_taskforces = models.ManyToManyField(TaskForce, related_name='events_attending', blank=True)

    files = models.ManyToManyField(FileAppData, blank=True)
    
    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Create comment thread if it doesn't exist
        newThread = False
        if not self.comment_thread_id:
            thread = CommentThread.objects.create()
            self.comment_thread = thread
            newThread = True
            
        ret = super().save(*args, **kwargs)

        # We need to wait until the new object has an ID before assigning the inverse thread relationship
        if newThread:
            thread.content_object = self
            thread.save()

        return ret

    def delete(self, *args, **kwargs):
        # Delete comment thread
        self.comment_thread.delete()
        return super().delete(*args, **kwargs)
    
    def clone(self, owner):
        # Ensure only superusers can create global events
        is_global = self.is_global and owner.is_superuser
        
        return self.__class__(
            title=self.title,
            owner=owner,
            team=self.team,
            start=self.start,
            end=self.end,
            is_global=is_global,
            location=self.location,
            description=self.description
        )
