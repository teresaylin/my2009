from django.db import models

from apps.users.models import TaskForce

class DailyTaskForceStats(models.Model):
    class Meta:
        app_label = 'stats'
        unique_together = ('taskforce', 'date')

    taskforce = models.ForeignKey(TaskForce, related_name='daily_stats')
    date = models.DateField()

    tasksAssigned = models.PositiveIntegerField()
    eventsAttending = models.PositiveIntegerField()

    totalTasksAssigned = models.PositiveIntegerField()
    totalEventsAttending = models.PositiveIntegerField()
