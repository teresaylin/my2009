from django.db import models

class DailyGlobalStats(models.Model):
    class Meta:
        app_label = 'stats'
        permissions = (
            ('can_view_stats', 'Can view all stats'),
        )

    date = models.DateField(unique=True)

    tasksOpen = models.PositiveIntegerField()
    eventsScheduled = models.PositiveIntegerField()
    dropboxFiles = models.PositiveIntegerField()
