from datetime import datetime, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.users.models import Team
from apps.events.models import Event
from apps.tasks.models import Task

from libs import tracking

class Command(BaseCommand):
    help = 'Gather daily app statistics'

    def handle(self, *args, **options):
        # Get time range for the entire day
        now = timezone.now()
        startTime = now.replace(hour=0, minute=0, second=0, microsecond=0)
        endTime = startTime + timedelta(days=1)
        
        for team in Team.objects.all():
            # Get number of open tasks
            tasks = Task.objects.all() \
                .filter(owner__teams__in=[team]) \
                .exclude(state='completed')
            
            # Get number of events scheduled for today
            events = Event.objects.all() \
                .filter(owner__teams__in=[team]) \
                .filter(start__gte=startTime, end__lt=endTime)
            
            tracking.teamOpenTasks(team, tasks.count(), startTime.date())
            tracking.teamEventsToday(team, events.count(), startTime.date())