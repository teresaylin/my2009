from rest_framework import serializers

from apps.users.serializers import TaskForceSerializer, UserSerializer

from ..models import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'name', 'parent', 'owner', 'order', 'completed_by', 'description', 'due_time', 'assigned_taskforces', 'assigned_users')
        
    owner = UserSerializer(read_only=True)
    completed_by = UserSerializer(read_only=True)
    assigned_taskforces = TaskForceSerializer(read_only=True)
    assigned_users = UserSerializer(read_only=True)