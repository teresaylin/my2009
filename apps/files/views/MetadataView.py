from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ParseError

import dropbox

from ..classes import AppDropboxClient
from ..utils import userPathToDropboxPath, dropboxPathToUserPath
from ..exceptions import FileNotFound
from ..models import FileAppData
from ..serializers import FileAppDataSerializer

class MetadataView(APIView):
    
    def get(self, request, format=None):
        # Get path from query string
        path = request.GET.get('path', None)
        if not path:
            raise ParseError('No path given')
        
        # Transform user path to Dropbox path
        path = userPathToDropboxPath(path, request.user)
        
        # Create Dropbox client object
        client = AppDropboxClient()
        
        # Retrieve metadata
        try:
            data = client.metadata(path)
        except dropbox.rest.ErrorResponse as e:
            if e.status == 404:
                raise FileNotFound()
            else:
                raise
            
        if 'contents' in data:
            fileMap = {}
            for file in data['contents']:
                if file['is_dir']:
                    continue
                fileMap[file['path'].lower()] = file
                
            dataObjs = FileAppData.objects.filter(path__in=fileMap.keys())
            for dataObj in dataObjs:
                fileMap[dataObj.path]['app_data'] = FileAppDataSerializer(dataObj).data

        # Transform Dropbox paths to user paths
        data['path'] = dropboxPathToUserPath(data['path'])
        if 'contents' in data:
            for file in data['contents']:
                file['path'] = dropboxPathToUserPath(file['path'])
            
        return Response(data)