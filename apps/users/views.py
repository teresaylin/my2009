from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import link

from .models import Task, Team
from .serializers import TaskSerializer, TeamSerializer, UserSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Return only logged-in user if 'current' parameter is given
        current = self.request.QUERY_PARAMS.get('current', None)
        if current is not None:
            queryset = queryset.filter(pk=self.request.user.id)
            
        return queryset