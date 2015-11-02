from rest_framework import serializers

from notifications.models import Notification

from apps.files.models import FileAppData

class ContentTypeField(serializers.Field):
    def to_native(self, obj):
        if obj:
            if obj.app_label == 'files' and obj.model == 'fileappdata':
                return 'file'
            else:
                return str(obj)
        else:
            return None

class GenericObjectField(serializers.Field):
    def to_native(self, obj):
        if obj:
            cls = obj.__class__

            if cls == FileAppData:
                # Files should show as user paths, not full Dropbox paths
                return obj.getUserPath()
            else:
                return str(obj)
        else:
            return None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'timestamp', 'unread',
            'actor_content_type', 'actor_object_id', 'actor',
            'verb',
            'action_object_content_type', 'action_object_object_id', 'action_object',
            'target_content_type', 'target_object_id', 'target')

    actor_content_type = ContentTypeField()
    actor = GenericObjectField()
    verb = serializers.RelatedField()
    action_object_content_type = ContentTypeField()
    action_object = GenericObjectField()
    target_content_type = ContentTypeField()
    target = GenericObjectField()
