from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ParseError

from ..models import UserDropbox

class StatusView(APIView):
    
    def get(self, request, format=None):
        # Get user Dropbox access token
        try:
            ud = UserDropbox.objects.get(user=request.user)
        except UserDropbox.DoesNotExist:
            ud = None
            
        status = {}
        if ud:
            # User has Dropbox access token, check it's still valid
            if ud.isValid():
                status['authorized'] = True
                status['email'] = ud.dropbox_email
            else:
                status['authorized'] = False
        else:
            # No access token
            status['authorized'] = False
            
        return Response(status)