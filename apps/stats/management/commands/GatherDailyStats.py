from datetime import datetime, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.users.models import Team, User, TaskForce
from apps.events.models import Event
from apps.tasks.models import Task

from ...models import DailyTeamStats, DailyUserStats, DailyTaskForceStats, DailyGlobalStats

from apps.files.stats import teamFilesCount, globalFilesCount

class Command(BaseCommand):
    help = 'Gather daily app statistics'

    def handle(self, *args, **options):
        # Get time range for the entire day
        now = timezone.now()
        startTime = now.replace(hour=0, minute=0, second=0, microsecond=0)
        endTime = startTime + timedelta(days=1)

        self.gatherTeamStats(startTime, endTime)
        self.gatherUserStats(startTime, endTime)
        self.gatherTaskForceStats(startTime, endTime)
        self.gatherGlobalStats(startTime, endTime)
        
    def gatherTeamStats(self, startTime, endTime):
        for team in Team.objects.all():
            # Get number of open tasks
            tasks = Task.objects.all() \
                .filter(owner__teams__in=[team]) \
                .exclude(state='completed')
            
            # Get number of events scheduled for today
            events = Event.objects.all() \
                .filter(owner__teams__in=[team]) \
                .filter(start__gte=startTime, end__lt=endTime)

            # Get number of Dropbox files in the team folder
            dropboxFiles = teamFilesCount(team)
            
            # Record stats
            data = {
                'tasksOpen': tasks.count(),
                'eventsScheduled': events.count(),
                'dropboxFiles': dropboxFiles
            }
            DailyTeamStats.objects.update_or_create(
                team=team,
                date=startTime.date(),
                defaults=data
            )

    def gatherUserStats(self, startTime, endTime):
        for user in User.objects.all():
            data = {}

            data['tasksOwned'] = user.owned_tasks.all().count()
            data['tasksAssigned'] = user.assigned_tasks.all().count()
            data['eventsOwned'] = user.events_owned.all().count()
            data['eventsAttending'] = user.events_attending.all().count()

            # Record stats
            DailyUserStats.objects.update_or_create(
                user=user,
                date=startTime.date(),
                defaults=data
            )

    def gatherTaskForceStats(self, startTime, endTime):
        for taskforce in TaskForce.objects.all():
            data = {}
            data['tasksAssigned'] = taskforce.assigned_tasks.all().count()

            # Record stats
            DailyTaskForceStats.objects.update_or_create(
                taskforce=taskforce,
                date=startTime.date(),
                defaults=data
            )

    def gatherGlobalStats(self, startTime, endTime):
        data = {}

        # Get total number of open tasks
        data['tasksOpen'] = Task.objects.all() \
            .exclude(state='completed') \
            .count()
        
        # Get total number of events scheduled for today
        data['eventsScheduled'] = Event.objects.all() \
            .filter(start__gte=startTime, end__lt=endTime) \
            .count()

        # Get total number of Dropbox files
        data['dropboxFiles'] = globalFilesCount()
        
        # Record stats
        DailyGlobalStats.objects.update_or_create(
            date=startTime.date(),
            defaults=data
        )
