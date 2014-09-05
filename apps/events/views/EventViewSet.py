from django.core.exceptions import ValidationError
from django.db.models import Q

from rest_framework import viewsets
from rest_framework.exceptions import ParseError

from ..models import Event
from ..serializers import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    #filter_fields = ('teams',)
    ordering = ('start',)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Get filter parameters
        start = self.request.QUERY_PARAMS.get('start', None)
        end = self.request.QUERY_PARAMS.get('end', None)

        try:
            # Filter by time range
            if start is not None:
                queryset = queryset.filter(Q(start__gt=start) | Q(end__gt=start))
            if end is not None:
                queryset = queryset.filter(start__lt=end)
        except ValidationError:
            raise ParseError('Invalid date')
            
        return queryset
    
    def pre_save(self, obj):
        obj.owner = self.request.user