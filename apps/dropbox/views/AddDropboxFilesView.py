from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ParseError

import dropbox

from apps.files.exceptions import FileIsNotADirectory, FileNotFound
from apps.files.models import File

from ..models import FileDropbox, UserDropbox
from ..exceptions import DropboxUnauthorized, DropboxFileNotFound

class AddDropboxFilesView(APIView):
    
    def post(self, request, format=None):
        # Get directory File object
        try:
            dirFileId = int(self.request.DATA.get('dir_file_id', None))
            dir = File.objects.get(id=dirFileId)
        except TypeError:
            raise ParseError('No dir_file_id specified')
        except ValueError:
            raise ParseError('Invalid dir_file_id')
        except File.DoesNotExist:
            raise FileNotFound()
        
        # Check file is a directory
        if not dir.is_directory:
            raise FileIsNotADirectory()
        
        # Get current user's Dropbox credentials
        ud = request.user.user_dropbox
        if not ud:
            raise DropboxUnauthorized()
        
        # Create DropboxClient object
        client = ud.createDropboxClient()

        # Get files array
        files = self.request.DATA.get('files', None)
        if not files:
            raise ParseError('No files specified')
        
        # Files validation
        try:
            _ = [str(file['path']) for file in files]
        except (TypeError, KeyError):
            raise ParseError('Invalid files format')
        
        # Add files
        for file in files:        
            path = file['path']
            
            # Retrieve file metadata
            try:
                data = client.metadata(path)
            except dropbox.rest.ErrorResponse as e:
                if e.status == 404:
                    raise DropboxFileNotFound()
                else:
                    raise
                
            # Create File object
            file = File.objects.create(
                parent=dir,
                name=FileDropbox.basename(path),
                is_directory=False,
                owner=self.request.user,
                size=0,
                icon=''
            )
            
            # Create FileDropbox object
            fileDropbox = FileDropbox.objects.create(
                file=file,
                path=path
            )
            
            # Update file metadata
            fileDropbox.updateMetadata()
            
        return Response({})