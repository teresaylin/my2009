from django.db import models

from apps.users.models import User

class DailyUserStats(models.Model):
    class Meta:
        app_label = 'stats'
        unique_together = ('user', 'date')

    user = models.ForeignKey(User, related_name='daily_stats')
    date = models.DateField()

    tasksOwned = models.PositiveIntegerField()
    tasksAssigned = models.PositiveIntegerField()
    eventsOwned = models.PositiveIntegerField()
    eventsAttending = models.PositiveIntegerField()
