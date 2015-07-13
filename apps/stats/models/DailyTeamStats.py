from django.db import models

from apps.users.models import Team

class DailyTeamStats(models.Model):
    class Meta:
        app_label = 'stats'
        unique_together = ('team', 'date')

    team = models.ForeignKey(Team, related_name='daily_stats')
    date = models.DateField()

    tasksOpen = models.PositiveIntegerField()       # Number of tasks uncompleted at the start of the day
    eventsScheduled = models.PositiveIntegerField() # Number of events scheduled for this day
    dropboxFiles = models.PositiveIntegerField()   # Total number of Dropbox files in the team folder
