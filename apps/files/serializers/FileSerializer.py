from rest_framework import serializers

from apps.users.serializers import UserSerializer

from ..models import File

class SubFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ('id', 'name', 'is_directory', 'owner', 'size', 'modified_time', 'icon')

    owner = UserSerializer()

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ('id', 'name', 'parent', 'is_directory', 'owner', 'size', 'modified_time', 'icon', 'files')
        
    owner = UserSerializer()
    files = SubFileSerializer()