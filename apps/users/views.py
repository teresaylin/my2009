from datetime import datetime

from django.utils.timezone import utc
from django.db.models import Q
from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import link

from .models import TaskForce, Team, UserProfile, Milestone, Comment
from .serializers import TaskForceSerializer, TeamSerializer, UserSerializer, UserProfileSerializer, MilestoneSerializer, CommentSerializer

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
            
        # Perform name search
        searchName = self.request.QUERY_PARAMS.get('search_name', None)
        if searchName is not None:
            if ' ' in searchName:
                # Search by partial full name (e.g. John Smi)
                tok = searchName.split(' ', 1)
                queryset = queryset.filter(first_name__iexact=tok[0], last_name__istartswith=tok[1])
            else:
                # Search first name or last name
                queryset = queryset.filter(Q(first_name__icontains=searchName) | Q(last_name__icontains=searchName))
            
        return queryset

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    filter_fields = ('user',)
    
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

        # Perform name search
        searchName = self.request.QUERY_PARAMS.get('search_name', None)
        if searchName is not None:
            queryset = queryset.filter(name__icontains=searchName)
            
        return queryset
    
class MilestoneViewSet(viewsets.ModelViewSet):
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    ordering = ('end_date',)
    
class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    filter_fields = ('thread',)
    ordering = ('-time',)

    def pre_save(self, obj):
        # Set user
        obj.user = self.request.user

        # Set time to now
        obj.time = datetime.utcnow().replace(tzinfo=utc)