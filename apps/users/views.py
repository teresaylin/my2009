from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import link

from .models import Task, TaskForce, Team
from .serializers import TaskSerializer, TaskForceSerializer, TeamSerializer, UserSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_fields = ('teams',)
    ordering = ('last_name',)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Return only logged-in user if 'current' parameter is given
        current = self.request.QUERY_PARAMS.get('current', None)
        if current is not None:
            queryset = queryset.filter(pk=self.request.user.id)
            
        return queryset
    
class TaskForceViewSet(viewsets.ModelViewSet):
    queryset = TaskForce.objects.all()
    serializer_class = TaskForceSerializer
    filter_fields = ('team',)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Show only task forces where parent_task_force = null, if "root" param is given
        root = self.request.QUERY_PARAMS.get('root', None)
        if root is not None:
            queryset = queryset.filter(parent_task_force=None)
            
        return queryset