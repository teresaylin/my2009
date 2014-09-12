from rest_framework import serializers

from apps.users.serializers import TaskForceSerializer, UserSerializer

from ..models import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'name', 'parent', 'owner', 'completed_by', 'description', 'due_time', 'state', 'comment_thread', 'assigned_taskforces', 'assigned_users')
        read_only_fields = ('state', 'comment_thread',)
        
    owner = UserSerializer(read_only=True)
    completed_by = UserSerializer(read_only=True)
    assigned_taskforces = TaskForceSerializer(read_only=True)
    assigned_users = UserSerializer(read_only=True)