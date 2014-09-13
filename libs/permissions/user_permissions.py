from django.contrib.auth.models import User
from apps.events.models import Event
from apps.users.models import Comment, Role, TaskForce, Team, UserProfile

def filterQueryset(queryset, user):
    cls = queryset.model
    
    if cls == Comment:
        # All comments visible to all users
        return queryset
    elif cls == Event:
        # Only show events belonging to user's teams
        return queryset.filter(owner__teams__in=user.teams.all())
    elif cls == Role:
        # Roles visible to all users
        return queryset
    elif cls == TaskForce:
        # Only show task forces belonging to user's teams
        return queryset.filter(team=user.teams.all())
    elif cls == Team:
        # Teams visible to all users
        return queryset
    elif cls == User:
        # Users visible to all users
        return queryset
    elif cls == UserProfile:
        # User profiles visible to all users
        return queryset
    else:
        raise PermissionDenied()

def getUserPermissions(user, cls):
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
    elif cls == Event:
        # Users can create/read/update/delete events
        perms['create'] = True
        perms['read'] = True
        perms['update'] = True
        perms['delete'] = True
    elif cls == Role:
        # Users can see roles
        perms['read'] = True
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
        # Users can see users
        perms['read'] = True
    elif cls == UserProfile:
        # Users can see and update profiles
        perms['read'] = True
        perms['update'] = True
        
    return perms

def getUserObjectPermissions(user, obj):
    # Note: it is implied the user can read the object as this function should be called after the
    # queryset containing the object has been filtered through filterQueryset()
    perms = {
        'create': False,
        'read': True,
        'update': False,
        'delete': False
    }

    cls = obj.__class__
    
    if cls == Event:
        # User can update/delete events they own
        if obj.owner == user:
            perms['update'] = True
            perms['delete'] = True
    elif cls == UserProfile:
        # User can update own profile
        if obj.user == user:
            perms['update'] = True
        
    return perms