from django.db.models import Q
from django.core.exceptions import PermissionDenied
from django.contrib.auth.models import User
from apps.courses.models import Course
from apps.events.models import Event
from apps.tasks.models import Task
from apps.users.models import Comment, CommentThreadSubscription, Milestone, Role, TaskForce, Team, UserProfile, UserSetting
from apps.stats.models import DailyGlobalStats, DailyTaskForceStats, DailyTeamStats, DailyUserStats
from notifications.models import Notification

def filterQueryset(queryset, user):
    """This function performs permission checks and filters querysets appropriately, before they are serialized and sent out as API responses."""
    
    # Bypass filtering for superusers
    if user.is_superuser:
        return queryset

    cls = queryset.model
    
    if cls == Comment:
        # All comments visible to all users
        return queryset
    elif cls == CommentThreadSubscription:
        # Only show subscriptions belonging to user
        return queryset.filter(user=user)
    elif cls == Course:
        # Only show courses which any of the user's teams belong to
        return queryset.filter(teams=user.teams.all())
    elif cls == Event:
        # Only show events belonging to user's teams, or any events marked as global
        return queryset.filter(Q(owner__teams__in=user.teams.all()) | Q(is_global=True))
    elif cls == Milestone:
        # All milestones visible to all users
        return queryset
    elif cls == Role:
        # Roles visible to all users
        return queryset
    elif cls == Task:
        # Only show tasks belonging to user's teams
        return queryset.filter(owner__teams__in=user.teams.all())
    elif cls == TaskForce:
        # Only show task forces belonging to user's teams
        return queryset.filter(team=user.teams.all())
    elif cls == Team:
        # User can only see teams belonging to courses that any of the user's teams belong to
        return queryset.filter(course__in=Course.objects.filter(teams=user.teams.all()))
    elif cls == User:
        # Users visible to all users
        return queryset
    elif cls == UserProfile:
        # User profiles visible to all users
        return queryset
    elif cls == UserSetting:
        # User can only see their own settings
        return queryset.filter(user=user)
    elif (cls == DailyGlobalStats or \
        cls == DailyTaskForceStats or \
        cls == DailyTeamStats or \
        cls == DailyUserStats) \
    :
        # Stats have a Django permission to determine whether the user can see them
        if user.has_perm('stats.can_view_stats'):
            return queryset
        else:
            raise PermissionDenied()
    elif cls == Notification:
        # User can only see own notifications
        return queryset.filter(recipient=user)
    else:
        raise PermissionDenied()

def getUserPermissions(user, cls):
    """This returns user permissions on a per-model basis."""
    
    # Superuser has full permissions
    if user.is_superuser:
        return {
            'create': True,
            'read': True,
            'update': True,
            'delete': True,
        }

    perms = {
        'create': False,
        'read': False,
        'update': False,
        'delete': False
    }
    
    if cls == Comment:
        # Users can create/read comments
        perms['create'] = True
        perms['read'] = True
    if cls == CommentThreadSubscription:
        # Users can create/read/update/delete subscriptions
        perms['create'] = True
        perms['read'] = True
        perms['update'] = True
        perms['delete'] = True
    elif cls == Course:
        # Courses are read-only in the API
        perms['read'] = True
    elif cls == Event:
        # Users can create/read/update/delete events
        perms['create'] = True
        perms['read'] = True
        perms['update'] = True
        perms['delete'] = True
    elif cls == Milestone:
        # Users can see milestones
        perms['read'] = True
    elif cls == Role:
        # Users can see roles
        perms['read'] = True
    elif cls == Task:
        # Users can create/read/update/delete tasks
        perms['create'] = True
        perms['read'] = True
        perms['update'] = True
        perms['delete'] = True
    elif cls == TaskForce:
        # Users can create/read/update/delete task forces
        perms['create'] = True
        perms['read'] = True
        perms['update'] = True
        perms['delete'] = True
    elif cls == Team:
        # Users can see teams
        perms['read'] = True
    elif cls == User:
        # Users can see/update users
        perms['read'] = True
        perms['update'] = True
    elif cls == UserProfile:
        # Users can see and update profiles
        perms['read'] = True
        perms['update'] = True
    elif cls == UserSetting:
        # Users can create/read/update/delete settings
        perms['create'] = True
        perms['read'] = True
        perms['update'] = True
        perms['delete'] = True
    elif cls == Notification:
        # Users can read/update/delete notifications
        perms['read'] = True
        perms['update'] = True
        perms['delete'] = True
        
    return perms

def getUserObjectPermissions(user, obj, request=None):
    """This returns user permissions on a per-object basis."""

    # Superuser has full permissions
    if user.is_superuser:
        return {
            'read': True,
            'update': True,
            'delete': True,
        }

    # Note: it is implied the user can read the object as this function should be called after the
    # queryset containing the object has been filtered through filterQueryset()
    perms = {
        'read': True,
        'update': False,
        'delete': False
    }

    cls = obj.__class__

    def getUserTaskforcesAll():
        # Use per-request cache if available
        if request and hasattr(request, 'appCache'):
            return request.appCache.getUserTaskforcesAll(user)
        else:
            return user.taskforces.all()
    
    if cls == CommentThreadSubscription:
        # User can update/delete their own subscriptions
        if obj.user == user:
            perms['update'] = True
            perms['delete'] = True
        pass
    elif cls == Event:
        # User can update/delete events they own
        if obj.owner == user:
            perms['update'] = True
            perms['delete'] = True
    elif cls == Task:
        # Inherit parent task permissions
        if obj.parent:
            perms = getUserObjectPermissions(user, obj.parent, request=request)
        # User can update/delete tasks they own
        elif obj.owner == user:
            perms['update'] = True
            perms['delete'] = True
        # Users assigned to task can edit task
        elif user in obj.assigned_users.all():
            perms['update'] = True
        # Users, belonging to a task force which is assigned to this task, can edit task
        elif any(tf in obj.assigned_taskforces.all() for tf in getUserTaskforcesAll()):
            perms['update'] = True
    elif cls == TaskForce:
        # User can edit task forces belonging to teams to which they are assigned
        if obj.team in user.teams.all():
            perms['update'] = True
            perms['delete'] = True
    elif cls == User:
        # User can update own User object
        if obj == user:
            perms['update'] = True
    elif cls == UserProfile:
        # User can update own profile
        if obj.user == user:
            perms['update'] = True
    elif cls == UserSetting:
        # User can update/delete own settings
        if obj.user == user:
            perms['update'] = True
            perms['delete'] = True
    elif cls == Notification:
        # User can update/delete notifications sent to them
        if obj.recipient == user:
            perms['update'] = True
            perms['delete'] = True
        
    return perms
