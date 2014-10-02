from django.views.generic import View
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest

import dropbox

from ..classes import AppDropboxClient
from ..utils import userPathToDropboxPath

class ThumbnailView(View):

    def get(self, request, path=None, size=None, format=None):
        # Only allow logged-in users
        if not request.user.is_authenticated():
            return HttpResponse('Unauthorized', status=401)

        # Get requested image format
        format = format.upper()
        if not format in ['JPEG', 'PNG']:
            return HttpResponseBadRequest('Invalid file type')

        # Transform user path to Dropbox path
        path = userPathToDropboxPath(path, request.user)
        
        # Get thumbnail from Dropbox
        cl = AppDropboxClient()
        try:
            apiResponse = cl.thumbnail(path, size, format)
        except dropbox.rest.ErrorResponse as e:
            if e.status == 400:
                # Bad request
                return HttpResponseBadRequest()
            elif e.status == 404:
                # Image not available
                return HttpResponseNotFound()
            elif e.status == 415:
                # Invalid image
                return HttpResponseNotFound()
            else:
                raise
        
        # Create response
        data = apiResponse.read()
        response = HttpResponse(data, content_type=apiResponse.getheader('Content-Type'))
        response['Cache-Control'] = 'public, max-age=600'
        
        # Cleanup
        apiResponse.close()
        
        return response