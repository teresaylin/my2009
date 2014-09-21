from rest_framework import serializers
from libs.permissions.serializers import ObjectPermissionsSerializerMixin

from apps.users.serializers import TaskForceSerializer, UserSerializer

from ..models import Task

class TaskSerializer(ObjectPermissionsSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'name', 'parent', 'owner', 'completed_by', 'description', 'due_time', 'state', 'comment_thread', 'assigned_taskforces', 'assigned_users')
        read_only_fields = ('state',)
        
    owner = UserSerializer(read_only=True)
    completed_by = UserSerializer(read_only=True)
    assigned_taskforces = TaskForceSerializer(read_only=True)
    assigned_users = UserSerializer(read_only=True)
    
    comment_thread = serializers.SerializerMethodField('getCommentThread')
    def getCommentThread(self, obj):
        return str(obj.comment_thread.publicId)