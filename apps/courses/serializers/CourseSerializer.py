from rest_framework import serializers

from ..models import Course
from apps.users.serializers import TeamSerializer

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ('id', 'title', 'teams')

    teams = TeamSerializer()
