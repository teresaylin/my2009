from rest_framework import serializers

from ..models import File

class SubFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ('id', 'name', 'is_directory', 'owner', 'size', 'modified_time', 'icon')

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ('id', 'name', 'parent', 'is_directory', 'owner', 'size', 'modified_time', 'icon', 'files')
        
    files = SubFileSerializer()