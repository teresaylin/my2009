from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from apps.users.models import Team, UserTeamMapping, Role, UserRoleMapping, UserProfile, Milestone, TaskForce, UserTaskForceMapping, Task

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

class TaskAdmin(admin.ModelAdmin):
    pass
admin.site.register(Task, TaskAdmin)