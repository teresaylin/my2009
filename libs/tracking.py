from django.conf import settings

from .statsmix import StatsMix

if hasattr(settings, 'STATSMIX_URL'):
    statsmix = StatsMix(settings.STATSMIX_URL)
else:
    statsmix = None

def trackEventCreated(event):
    if not statsmix: return

    for team in event.owner.teams.all():
        statsmix.track('Events created - ' + team.name)

def trackTaskCreated(task):
    if not statsmix: return

    for team in task.owner.teams.all():
        statsmix.track('Tasks created - ' + team.name)

def trackTaskCompleted(task):
    if not statsmix: return

    for team in task.owner.teams.all():
        statsmix.track('Tasks completed - ' + team.name)

def teamOpenTasks(team, count, date):
    if not statsmix: return
    
    if count > 0:
        statsmix.track('Tasks open - ' + team.name, count, generated_at=date)

def teamEventsToday(team, count, date):
    if not statsmix: return
    
    if count > 0:
        statsmix.track('Events scheduled - ' + team.name, generated_at=date)