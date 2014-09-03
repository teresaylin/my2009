from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ParseError

import dropbox

from ..models import UserDropbox
from ..exceptions import DropboxUnauthorized, DropboxFileNotFound

class MetadataView(APIView):
    
    def get(self, request, format=None):
        # Get path from query string
        path = request.GET.get('path', None)
        if not path:
            raise ParseError('No path given')
        
        # Get current user's Dropbox credentials
        ud = request.user.user_dropbox
        if not ud:
            raise DropboxUnauthorized()
        
        # Create DropboxClient object
        client = ud.createDropboxClient()
        
        # Retrieve metadata
        try:
            data = client.metadata(path)
        except dropbox.rest.ErrorResponse as e:
            if e.status == 404:
                raise DropboxFileNotFound()
            else:
                raise
            
        return Response(data)