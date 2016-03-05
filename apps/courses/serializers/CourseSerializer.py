from rest_framework import serializers

from ..models import Course
from apps.users.serializers import TeamSerializer
from libs.MediaFileSerializer import MediaFileSerializer

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ('id', 'title', 'website_url', 'website_name',
            'logo', 'logo_width', 'logo_height', 'teams')

    logo = MediaFileSerializer()
    teams = TeamSerializer()
