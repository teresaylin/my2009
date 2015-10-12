from rest_framework import serializers

from notifications.models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'timestamp', 'unread',
            'actor_content_type', 'actor_object_id', 'actor',
            'verb',
            'action_object_content_type', 'action_object_object_id', 'action_object',
            'target_content_type', 'target_object_id', 'target')

    actor_content_type = serializers.RelatedField()
    actor = serializers.RelatedField()
    verb = serializers.RelatedField()
    action_object_content_type = serializers.RelatedField()
    action_object = serializers.RelatedField()
    target = serializers.RelatedField()
