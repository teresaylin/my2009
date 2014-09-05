from rest_framework import serializers

from apps.users.serializers import UserSerializer

from ..models import Task

class TaskSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Task
        fields = ('url', 'id', 'name', 'parent', 'completed_by', 'order', 'description', 'due_time')