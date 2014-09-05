from django.db import models
from django.contrib.auth.models import User

from apps.users.models import TaskForce

class Task(models.Model):
    class Meta:
        app_label = 'tasks'

    name = models.CharField(max_length=50, blank=False)
    parent = models.ForeignKey('Task', blank=True, null=True)
    owner = models.ForeignKey(User, related_name='owned_tasks')
    order = models.IntegerField()
    description = models.TextField(blank=True)
    due_time = models.DateTimeField()
    state = models.CharField(max_length=50)
    completed_by = models.ForeignKey(User, related_name='completed_tasks', null=True, blank=True)

    assigned_task_forces = models.ManyToManyField(TaskForce)
    assigned_users = models.ManyToManyField(User)

    def __str__(self):
        return str(self.name)
