from django.conf import settings
import dropbox

class AppDropboxClient(dropbox.client.DropboxClient):

    def __init__(self, **kwargs):
        super().__init__(settings.DROPBOX_ACCESS_TOKEN)