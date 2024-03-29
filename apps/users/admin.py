from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin
from django.template import Context
from django.template.loader import get_template
from django.core.mail import send_mass_mail
from django.core.urlresolvers import reverse
from django.contrib.messages import ERROR, WARNING
from django.shortcuts import render_to_response, redirect
from django.conf import settings

from apps.users.models import Team, UserTeamMapping, Role, UserRoleMapping, UserProfile, UserSetting, Milestone, TaskForce, UserTaskForceMapping, CommentThread

class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'team_email')

admin.site.register(Team, TeamAdmin)

class UserTeamMappingAdmin(admin.ModelAdmin):
    list_display = ('user', 'team')

admin.site.register(UserTeamMapping, UserTeamMappingAdmin)

#class UserTeamMappingInline(admin.TabularInline):
#    model = UserTeamMapping

#class UserWithTeamMappingAdmin(UserAdmin):
#    inlines = [UserTeamMappingInline]
#    list_display = ('pk', 'username', 'email', 'first_name', 'last_name')

#admin.site.unregister(User)
#admin.site.register(UserWithTeamMappingAdmin)

class RoleAdmin(admin.ModelAdmin):
    display = ('name',)
    list_display = ('name', 'required_role', 'user_assignable')

admin.site.register(Role, RoleAdmin)

class UserRoleMappingAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'role')

admin.site.register(UserRoleMapping, UserRoleMappingAdmin)

class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number' , 'car', 'course_load')

admin.site.register(UserProfile, UserProfileAdmin)

class UserSettingAdmin(admin.ModelAdmin):
    list_display = ('user', 'name' , 'version', 'value')

admin.site.register(UserSetting, UserSettingAdmin)

#new, incomplete table columns

class MilestoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'end_date')

admin.site.register(Milestone, MilestoneAdmin)

class TaskForceAdmin(admin.ModelAdmin):
    list_display = ('name', 'milestone')

admin.site.register(TaskForce, TaskForceAdmin)

class CommentThreadAdmin(admin.ModelAdmin):
    list_display = ('publicId', 'content_type', 'object_id', 'content_object')
admin.site.register(CommentThread, CommentThreadAdmin)

class UserTaskForceMappingAdmin(admin.ModelAdmin):
    list_display = ('user', 'task_force')

admin.site.register(UserTaskForceMapping, UserTaskForceMappingAdmin)

from django.conf.urls import patterns, url
from django.views.generic import TemplateView
from django import forms
from django.template import RequestContext
from django.contrib import messages
from django.db import IntegrityError

class CustomUserAdmin(UserAdmin):
    actions = ['sendWelcomeEmail', 'assignRole', 'assignGroup']

    def get_urls(self):
        # Add "assign role" view to available URLs
        urls = super().get_urls()
        return [
            url(r'^assign_role/$', self.__class__.AssignRoleView.as_view(), name='assign-role'),
            url(r'^assign_group/$', self.__class__.AssignGroupView.as_view(), name='assign-group'),
        ] + urls

    def sendWelcomeEmail(self, request, queryset):
        """Generates a random password for, and sends a welcome e-mail to, the selected users"""
        messages = []
        subject = get_template('users/email/welcome-email-subject.txt').render(Context({}))
        appUrl = request.build_absolute_uri(reverse('webapp:app'))
        fromAddr = getattr(settings, 'EMAIL_FROM', None)

        for user in queryset:
            # Check user has an e-mail address
            if user.email == '':
                self.message_user(request, 'User %s has no e-mail address' % user.username, ERROR)
                continue

            # Assign new password
            newPassword = User.objects.make_random_password()
            user.set_password(newPassword)
            user.save()

            # Prepare e-mail
            context = {
                'appUrl': appUrl,
                'user': user,
                'password': newPassword
            }
            message = get_template('users/email/welcome-email.txt').render(Context(context))
            messages.append((subject, message, fromAddr, [user.email]))
        
        # Send messages
        if len(messages) > 0:
            sent = send_mass_mail(messages, fail_silently=True)
            self.message_user(request, '%d e-mails sent' % sent)
        else:
            self.message_user(request, 'No e-mails sent', WARNING)

    sendWelcomeEmail.short_description = 'Send welcome e-mail'

    class AssignRoleForm(forms.Form):
        users = forms.ModelMultipleChoiceField(queryset=User.objects.all())
        role = forms.ModelChoiceField(queryset=Role.objects.all())
    
    class AssignRoleView(TemplateView):
        template_name = 'users/admin/assign-role.html'
        
        def post(self, request):
            form = CustomUserAdmin.AssignRoleForm(request.POST)
            
            if form.is_valid():
                users = form.cleaned_data['users']
                role = form.cleaned_data['role']
                
                # Assign roles
                count = 0
                for user in users:
                    # Create UserRoleMapping object
                    try:
                        userRole = UserRoleMapping.objects.create(
                            user=user,
                            role=role,
                            status=''
                        )
                        count += 1
                    except IntegrityError:
                        # User already has role
                        messages.add_message(request, messages.WARNING, "Role already assigned to user '%s'" % (user.username,))
                
                # Send user message and redirect to user list
                if count > 0:
                    messages.add_message(request, messages.INFO, 'Role assigned to %d users' % (count,))
                else:
                    messages.add_message(request, messages.WARNING, 'No users were assigned roles')
                return redirect('admin:auth_user_changelist')

            context = super().get_context_data()
            context['form'] = form
            return self.render_to_response(context)
            
    def assignRole(self, request, queryset):
        """Assign a role to selected users"""
        form = self.__class__.AssignRoleForm(initial={
            'users': queryset
        })
        return render_to_response('users/admin/assign-role.html', {
            'form': form,
            'users': queryset
        }, context_instance=RequestContext(request))
    assignRole.short_description = 'Assign role'

    class AssignGroupForm(forms.Form):
        users = forms.ModelMultipleChoiceField(queryset=User.objects.all())
        group = forms.ModelChoiceField(queryset=Group.objects.all())
        unassign = forms.BooleanField(required=False, label='Remove users from group?')
    
    class AssignGroupView(TemplateView):
        template_name = 'users/admin/assign-group.html'
        
        def post(self, request):
            form = CustomUserAdmin.AssignGroupForm(request.POST)
            
            if form.is_valid():
                users = form.cleaned_data['users']
                group = form.cleaned_data['group']
                
                if form.cleaned_data['unassign']:
                    # Unassign group
                    count = 0
                    for user in users:
                        user.groups.remove(group)
                        count += 1
                    
                    # Send user message and redirect to user list
                    if count > 0:
                        messages.add_message(request, messages.INFO, '%d users removed from %s' % (count, group.name))
                    else:
                        messages.add_message(request, messages.WARNING, 'No users were removed from %s' % (group.name,))
                else:
                    # Assign group
                    count = 0
                    for user in users:
                        user.groups.add(group)
                        count += 1
                    
                    # Send user message and redirect to user list
                    if count > 0:
                        messages.add_message(request, messages.INFO, '%d users assigned to %s' % (count, group.name))
                    else:
                        messages.add_message(request, messages.WARNING, 'No users were assigned to %s' % (group.name,))

                return redirect('admin:auth_user_changelist')

            context = super().get_context_data()
            context['form'] = form
            return self.render_to_response(context)

    def assignGroup(self, request, queryset):
        """Assign selected users to a group"""
        form = self.__class__.AssignGroupForm(initial={
            'users': queryset
        })
        return render_to_response('users/admin/assign-group.html', {
            'form': form,
            'users': queryset
        }, context_instance=RequestContext(request))
    assignGroup.short_description = 'Assign/unassign group'


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
