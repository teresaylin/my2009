from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.exceptions import UserNotFound, TaskForceNotFound
from apps.users.models import TaskForce

from ..exceptions import TaskAlreadyAssignedToUser, TaskAlreadyAssignedToTaskForce
from ..models import Task
from ..serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().exclude(state='completed')
    serializer_class = TaskSerializer
    ordering = ('due_time',)
    
    def pre_save(self, obj):
        # Set owner
        obj.owner = self.request.user
        
    def post_save(self, obj, created=False):
        # Assign task to owner when object is created
        if created:
            obj.assigned_users.add(obj.owner)
            
    @action(methods=['PUT'])
    def complete(self, request, pk=None):
        task = self.get_object()
        
        # Mark task as completed
        task.state = task.COMPLETED
        task.completed_by = self.request.user
        task.save()
        
        # Return updated task
        return Response(TaskSerializer(task).data)

    @action(methods=['PUT'])
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

    @action(methods=['PUT'])
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

    @action(methods=['PUT'])
    def add_assigned_taskforce(self, request, pk=None):
        task = self.get_object()
        
        # Get TaskForce object
        try:
            taskforceId = request.DATA.get('taskforce_id', None)
            taskforce = TaskForce.objects.get(id=taskforceId)
        except TaskForce.DoesNotExist:
            raise TaskForceNotFound()
        
        # Assign task force to task
        if taskforce in task.assigned_taskforces.all():
            raise TaskAlreadyAssignedToTaskForce()
        else:
            task.assigned_taskforces.add(taskforce)
        
        return Response({})

    @action(methods=['PUT'])
    def remove_assigned_taskforce(self, request, pk=None):
        task = self.get_object()
        
        # Get TaskForce object
        try:
            taskforceId = request.DATA.get('taskforce_id', None)
            taskforce = TaskForce.objects.get(id=taskforceId)
        except TaskForce.DoesNotExist:
            raise TaskForceNotFound()
        
        # Remove task force assignation
        task.assigned_taskforces.remove(taskforce)
        
        return Response({})