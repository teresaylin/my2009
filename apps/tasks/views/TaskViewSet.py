from rest_framework import viewsets

from ..models import Task
from ..serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    ordering = ('due_time',)
    
    def pre_save(self, obj):
        # Set owner
        obj.owner = self.request.user