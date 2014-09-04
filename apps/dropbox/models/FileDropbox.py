from datetime import datetime, timedelta

from django.db import models

from apps.files.models import File

class FileDropbox(models.Model):
    class Meta:
        app_label = 'dropbox'

    file = models.OneToOneField(File, related_name='file_dropbox', primary_key=True)
    path = models.CharField(max_length=1000)
    
    @staticmethod
    def basename(path):
        """Returns filename of a given Dropbox path"""
        return path.split('/')[-1]
    
    def updateMetadata(self):
        # Create DropboxClient object
        ud = self.file.owner.user_dropbox
        client = ud.createDropboxClient()

        # Retrieve file metadata
        try:
            data = client.metadata(self.path)
        except dropbox.rest.ErrorResponse as e:
            if e.status == 404:
                raise DropboxFileNotFound()
            else:
                raise
            
        self.file.size = data['bytes']
        self.file.icon = data['icon']
        self.file.save()
    
    def getShareUrl(self):
        # Create DropboxClient object
        ud = self.file.owner.user_dropbox
        client = ud.createDropboxClient()

        # Get share URL
        try:
            data = client.share(self.path, False)
        except dropbox.rest.ErrorResponse as e:
            if e.status == 404:
                raise DropboxFileNotFound()
            else:
                raise
            
        return data['url']