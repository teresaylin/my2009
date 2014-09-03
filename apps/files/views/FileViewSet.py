from django.core.exceptions import ValidationError
from django.db.models import Q

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.exceptions import ParseError

from ..models import File
from ..serializers import FileSerializer

class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    ordering = ('name')
    
    def list(self, request):
        # Only show root directory when listing
        self.queryset = self.queryset.filter(parent=None)
        return super().list(request)