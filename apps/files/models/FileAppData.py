from django.db import models

from apps.users.models import CommentThread

class FileAppData(models.Model):
    path = models.CharField(max_length=512, unique=True)
    comment_thread = models.OneToOneField(CommentThread)
    
    def __str__(self):
        return self.path

    def save(self, *args, **kwargs):
        # Ensure paths are always lowercase (Dropbox paths are case insensitive)
        self.path = self.path.lower()
        
        # Create comment thread if it doesn't exist
        if not self.comment_thread_id:
            thread = CommentThread.objects.create()
            self.comment_thread = thread
            
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Delete comment thread
        self.comment_thread.delete()
        return super().delete(*args, **kwargs)