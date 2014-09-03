from django.core.exceptions import ValidationError
from django.db.models import Q

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.exceptions import ParseError
from rest_framework.decorators import action

from ..models import File
from ..serializers import FileSerializer
from ..exceptions import FileIsNotADirectory

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    ordering = ('name')
    
    def list(self, request):
        # Only show root directory when listing
        self.queryset = self.queryset.filter(parent=None)
        return super().list(request)
    
    @action()
    def create_subdirectory(self, request, pk=None):
        # Get filename from request data
        name = request.DATA.get('name', None)
        if not name:
            raise ParseError('No filename given')
        
        dirFile = self.get_object()
        
        dirFile.createSubdirectory(name, request.user)
        
        return Response({'test': 42}, status=201)