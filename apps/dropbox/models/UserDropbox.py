from datetime import datetime, timedelta

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

import dropbox

from my2009.settings.dropbox import DROPBOX_VALIDATE_INTERVAL

class UserDropbox(models.Model):
    class Meta:
        app_label = 'dropbox'

    user = models.ForeignKey(User, primary_key=True, related_name='user_dropbox')
    dropbox_uid = models.PositiveIntegerField()
    access_token = models.CharField(max_length=64)
    dropbox_email = models.CharField(max_length=255, default='')
    valid = models.BooleanField(default=False)
    last_validated = models.DateTimeField(default=datetime.min.replace(tzinfo=timezone.utc))
    
    def isValid(self):
        """Check Dropbox access token is valid"""
        
        if(timezone.now() > self.last_validated + timedelta(seconds=DROPBOX_VALIDATE_INTERVAL)):
            try:
                # Attempt to get Dropbox account info
                client = dropbox.client.DropboxClient(self.access_token)
                info = client.account_info()
                self.dropbox_email = info['email']
                self.valid = True
            except dropbox.rest.ErrorResponse as e:
                if e.status == 401:
                    # Invalid token
                    self.valid = False
                else:
                    raise

            self.last_validated = timezone.now()
            self.save()
            
        return self.valid