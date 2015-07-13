from django.db import models

class DailyGlobalStats(models.Model):
    class Meta:
        app_label = 'stats'

    date = models.DateField(unique=True)

    tasksOpen = models.PositiveIntegerField()
    eventsScheduled = models.PositiveIntegerField()
