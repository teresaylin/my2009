from django import forms
from django.conf.urls import patterns, url
from django.views.generic import TemplateView
from django.template import RequestContext
from django.shortcuts import render_to_response, redirect
from django.contrib import messages
from django.contrib import admin

from .models import Task

from apps.users.models import User, Team

class TaskAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'team', 'prototype')
    actions = ['cloneTasks']

    def get_urls(self):
        # Add "clone task" view to available URLs
        urls = super().get_urls()
        return [
            url(r'^clone_tasks/$', self.__class__.CloneTasksView.as_view(), name='clone-tasks'),
        ] + urls

    class CloneTasksForm(forms.Form):
        tasks = forms.ModelMultipleChoiceField(queryset=Task.objects.all())
        teams = forms.ModelMultipleChoiceField(queryset=Team.objects.all())
    
    class CloneTasksView(TemplateView):
        template_name = 'tasks/admin/clone-tasks.html'
        
        def post(self, request):
            form = TaskAdmin.CloneTasksForm(request.POST)
            
            if form.is_valid():
                tasks = form.cleaned_data['tasks']
                teams = form.cleaned_data['teams']
                
                tasksCreated = 0
                for task in tasks:
                    for team in teams:
                        users = User.objects.all().filter(teams__in=[team])
                        for user in users:
                            # Create new task
                            newTask = task.clone(request.user)
                            newTask.team = team
                            newTask.save()
                            
                            # Assign user to task
                            newTask.assigned_users.add(user)

                            tasksCreated += 1
                
                # Send user message and redirect to task list
                if tasksCreated > 0:
                    messages.add_message(request, messages.INFO, '%d tasks created' % (tasksCreated,))
                else:
                    messages.add_message(request, messages.WARNING, 'No new tasks were created')
                return redirect('admin:tasks_task_changelist')

            context = super().get_context_data()
            context['form'] = form
            return self.render_to_response(context)

    def cloneTasks(self, request, queryset):
        """Clone selected tasks"""
        form = self.__class__.CloneTasksForm(initial={
            'tasks': queryset
        })
        return render_to_response('tasks/admin/clone-tasks.html', {
            'form': form,
            'tasks': queryset
        }, context_instance=RequestContext(request))
    cloneTasks.short_description = 'Clone tasks'
    
admin.site.register(Task, TaskAdmin)
