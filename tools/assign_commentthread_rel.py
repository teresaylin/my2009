#!/usr/bin/env python3

# One-off script to retroactively set the generic relation on CommentThread objects

import sys
sys.path.append('')

import django
django.setup()

from apps.events.models import Event
from apps.tasks.models import Task
from apps.files.models import FileAppData

for event in Event.objects.all():
    thread = event.comment_thread

    if not thread.content_object:
        thread.content_object = event
        thread.save()

for task in Task.objects.all():
    thread = task.comment_thread

    if not thread.content_object:
        thread.content_object = task
        thread.save()

for fileData in FileAppData.objects.all():
    thread = fileData.comment_thread

    if not thread.content_object:
        thread.content_object = fileData
        thread.save()
