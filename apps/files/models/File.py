from datetime import datetime, timedelta

from django.db import models
from django.contrib.auth.models import User

class File(models.Model):
    class Meta:
        app_label = 'files'
        ordering = ('-is_directory', 'name')

    parent = models.ForeignKey('File', related_name='files', null=True, blank=True)
    name = models.CharField(max_length=255)
    is_directory = models.BooleanField()
    owner = models.ForeignKey(User)
    size = models.PositiveIntegerField()
    modified_time = models.DateTimeField()
    icon = models.CharField(max_length=50)
    
    def __str__(self):
        return self.name