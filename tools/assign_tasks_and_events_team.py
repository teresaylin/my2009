#!/usr/bin/env python3

# One-off script to retroactively set the team field on tasks and events

import sys
sys.path.append('')

import django
django.setup()

from apps.events.models import Event
from apps.tasks.models import Task

for event in Event.objects.all():
    if event.team:
        continue

    ownerTeams = event.owner.teams.all()
    if ownerTeams.count() > 1:
        print('Event ID %d "%s": owner belongs to multiple teams; skipping' % (event.id, event.title))
        continue
    if ownerTeams.count() == 0:
        print('Event ID %d "%s": owner has no team; skipping' % (event.id, event.title))
        continue
    team = ownerTeams[0]

    event.team = team
    event.save()

for task in Task.objects.all():
    if task.team:
        continue

    ownerTeams = task.owner.teams.all()
    if ownerTeams.count() > 1:
        print('Task ID %d "%s": owner belongs to multiple teams; skipping' % (task.id, task.name))
        continue
    if ownerTeams.count() == 0:
        print('Task ID %d "%s": owner has no team; skipping' % (task.id, task.name))
        continue
    team = ownerTeams[0]

    task.team = team
    task.save()
