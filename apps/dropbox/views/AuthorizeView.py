from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ParseError

import dropbox

from my2009.settings.dropbox import DROPBOX_APP_KEY, DROPBOX_APP_SECRET

from ..models import UserDropbox

class AuthorizationError(APIException):
    status_code = 400

class AuthorizeView(APIView):
    
    def get(self, request, format=None):
        # Get Dropbox app authorization URL
        flow = dropbox.client.DropboxOAuth2FlowNoRedirect(
            DROPBOX_APP_KEY,
            DROPBOX_APP_SECRET
        )
        authorizeUrl = flow.start()
    
        # Return auth URL
        return Response({
            'authorize_url': authorizeUrl
        })
        
    def post(self, request, format=None):
        # Get authorization code
        authCode = request.DATA.get('authorization_code', None)
        if not authCode:
            raise ParseError('authorization_code not supplied')

        # Finish app authorization
        flow = dropbox.client.DropboxOAuth2FlowNoRedirect(
            DROPBOX_APP_KEY,
            DROPBOX_APP_SECRET
        )
        try:
            accessToken, userId = flow.finish(authCode)
        except dropbox.rest.ErrorResponse as e:
            raise AuthorizationError('Invalid authorization code')
        
        # Create or update UserDropbox entry
        try:
            ud = UserDropbox.objects.get(user=request.user)
        except UserDropbox.DoesNotExist:
            ud = UserDropbox(user=request.user)
        ud.dropbox_uid = userId
        ud.access_token = accessToken
        ud.save()
        # Force validation check
        ud.isValid()
        
        # Return 200 response
        return Response({})