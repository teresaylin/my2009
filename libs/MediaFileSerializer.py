from rest_framework import serializers

class MediaFileSerializer(serializers.RelatedField):
    def to_native(self, value):
        return value.url if value else None
