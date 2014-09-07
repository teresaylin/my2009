from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.exceptions import UserNotFound

from ..exceptions import TaskAlreadyAssignedToUser
from ..models import Task
from ..serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    ordering = ('due_time',)
    
    def pre_save(self, obj):
        # Set owner
        obj.owner = self.request.user

    @action()
    def add_assigned_user(self, request, pk=None):
        task = self.get_object()
        
        # Get assigned User object
        try:
            userId = request.DATA.get('user_id', None)
            user = User.objects.get(id=userId)
        except User.DoesNotExist:
            raise UserNotFound()
        
        # Assign user to task
        if user in task.assigned_users.all():
            raise TaskAlreadyAssignedToUser()
        else:
            task.assigned_users.add(user)
        
        return Response({})

    @action()
    def remove_assigned_user(self, request, pk=None):
        task = self.get_object()
        
        # Get assigned User object
        try:
            userId = request.DATA.get('user_id', None)
            user = task.assigned_users.all().get(id=userId)
        except User.DoesNotExist:
            raise UserNotFound()
        
        # Remove user assignation
        task.assigned_users.remove(user)
        
        return Response({})