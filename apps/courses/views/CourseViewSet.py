from rest_framework import viewsets

from ..models import Course
from ..serializers import CourseSerializer

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()

        # Optimizations
        queryset = queryset \
            .prefetch_related('teams')

        return queryset
