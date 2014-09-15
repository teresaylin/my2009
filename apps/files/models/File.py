from datetime import datetime, timedelta

from django.db import models
from django.contrib.auth.models import User

from ..exceptions import FileInvalidFilename, FileAlreadyExists

class File(models.Model):
    BAD_FILENAME_CHARS = list('[]/\=+<>:;",*')

    class Meta:
        app_label = 'files'
        ordering = ('-is_directory', 'name')

    parent = models.ForeignKey('File', related_name='files', null=True, blank=True)
    name = models.CharField(max_length=255)
    is_directory = models.BooleanField(default=False)
    owner = models.ForeignKey(User)
    size = models.PositiveIntegerField()
    modified_time = models.DateTimeField(auto_now_add=True)
    icon = models.CharField(max_length=50)
    
    def __str__(self):
        return self.name
    
    @staticmethod
    def isValidFilename(name):
        for c in File.BAD_FILENAME_CHARS:
            if c in name:
                return False

        return True
    
    def hasFile(self, name):
        """Returns True if directory contains a file with given name"""
        return name.lower() in [file.name.lower() for file in self.files.all()]
    
    def createSubdirectory(self, name, owner):
        # Check filename is valid
        if not File.isValidFilename(name):
            raise FileInvalidFilename()
        
        # Check if file already exists
        if self.hasFile(name):
            raise FileAlreadyExists()
        
        # Create subdirectory
        subDir = File.objects.create(
            parent=self,
            name=name,
            is_directory=True,
            owner=owner,
            size=0,
            icon='folder'
        )
        
        return subDir