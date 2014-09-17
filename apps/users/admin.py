from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from django.template import Context
from django.template.loader import get_template
from django.core.mail import send_mass_mail
from django.core.urlresolvers import reverse
from django.contrib.messages import ERROR, WARNING
from apps.users.models import Team, UserTeamMapping, Role, UserRoleMapping, UserProfile, Milestone, TaskForce, UserTaskForceMapping

class TeamAdmin(admin.ModelAdmin):
    list_display = ('color', 'team_email')

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

admin.site.register(Role, RoleAdmin)

class UserRoleMappingAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'role')

admin.site.register(UserRoleMapping, UserRoleMappingAdmin)

class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number' , 'car')

admin.site.register(UserProfile, UserProfileAdmin)

#new, incomplete table columns

class MilestoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'end_date')

admin.site.register(Milestone, MilestoneAdmin)

class TaskForceAdmin(admin.ModelAdmin):
    list_display = ('name', 'milestone')

admin.site.register(TaskForce, TaskForceAdmin)

class UserTaskForceMappingAdmin(admin.ModelAdmin):
    list_display = ('user', 'task_force')

admin.site.register(UserTaskForceMapping, UserTaskForceMappingAdmin)

class CustomUserAdmin(UserAdmin):
    actions = ['sendWelcomeEmail']

    def sendWelcomeEmail(self, request, queryset):
        """Generates a random password for, and sends a welcome e-mail to, the selected users"""
        messages = []
        subject = get_template('users/email/welcome-email-subject.txt').render(Context({}))
        appUrl = request.build_absolute_uri(reverse('webapp:app'))

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
            messages.append((subject, message, None, [user.email]))
        
        # Send messages
        if len(messages) > 0:
            sent = send_mass_mail(messages, fail_silently=True)
            self.message_user(request, '%d e-mails sent' % sent)
        else:
            self.message_user(request, 'No e-mails sent', WARNING)

    sendWelcomeEmail.short_description = 'Send welcome e-mail'

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)