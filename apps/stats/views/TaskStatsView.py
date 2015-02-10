from copy import deepcopy
from datetime import timedelta

from django.db.models import Q
from django.utils.timezone import now

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ParseError
from rest_framework.permissions import IsAdminUser

from random import randint

from apps.tasks.models import Task
from apps.users.models import Team

class TaskStatsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        data = []

        teamsTmpl = {}
        for team in Team.objects.all():
            teamsTmpl[team.id] = {
                'team': {
                    'id': team.id,
                    'name': team.name
                },
                'assigned': 0,
                'completed': 0
            }
        
        # Get tasks; filter tasks older than one day
        cutoffTime = now() - timedelta(days=1)
        tasks = Task.objects.all() \
            .exclude(prototype_for=None) \
            .filter(Q(due_time=None) | Q(due_time__gt=cutoffTime))

        for task in tasks:
            teamStats = deepcopy(teamsTmpl)
            stat = {
                'task': {
                    'id': task.id,
                    'name': task.name
                },
                'teams': teamStats
            }
            
            # Tally users assigned/completed task
            totalAssigned = totalCompleted = 0
            for userTask in task.prototype_for.all():
                for user in userTask.assigned_users.all():
                    for team in user.teams.all():
                        teamStats[team.id]['assigned'] += 1
                        totalAssigned += 1
                        
                        if userTask.state == Task.COMPLETED:
                            teamStats[team.id]['completed'] += 1
                            totalCompleted += 1
                        
            stat['total'] = {
                'assigned': totalAssigned,
                'completed': totalCompleted
            }
                
            data.append(stat)
        
        return Response(data)