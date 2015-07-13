from django.conf import settings

from .models import FileAppData

def teamFilesCount(team):
    """Returns the total number of Dropbox files owned by a team"""
    path = (settings.DROPBOX_BASE_PATH + '/' + team.name + '/').lower()
    return FileAppData.objects.all().filter(path__startswith=path).count()

def globalFilesCount():
    """Returns the total number of Dropbox files under the main app folder"""
    path = (settings.DROPBOX_BASE_PATH + '/').lower()
    return FileAppData.objects.all().filter(path__startswith=path).count()
