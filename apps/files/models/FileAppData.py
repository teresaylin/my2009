from django.db import models

from apps.users.models import CommentThread

from ..utils import dropboxPathToUserPath

class FileAppData(models.Model):
    path = models.CharField(max_length=512, unique=True, db_index=True)
    comment_thread = models.OneToOneField(CommentThread)
    
    def __str__(self):
        return self.path
    
    def getUserPath(self):
        return dropboxPathToUserPath(self.path)

    def save(self, *args, **kwargs):
        # Ensure paths are always lowercase (Dropbox paths are case insensitive)
        self.path = self.path.lower()
        
        # Create comment thread if it doesn't exist
        newThread = False
        if not self.comment_thread_id:
            thread = CommentThread.objects.create()
            self.comment_thread = thread
            newThread = True
            
        ret = super().save(*args, **kwargs)

        # We need to wait until the new object has an ID before assigning the inverse thread relationship
        if newThread:
            thread.content_object = self
            thread.save()

        return ret

    def delete(self, *args, **kwargs):
        # Delete comment thread
        self.comment_thread.delete()
        return super().delete(*args, **kwargs)
