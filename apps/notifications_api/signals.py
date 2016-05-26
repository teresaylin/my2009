from django.dispatch import receiver
from django.db.models.signals import post_save

from notifications.models import Notification
from django_rt.publish import publish

from .serializers import NotificationSerializer

@receiver(post_save, sender=Notification)
def receive_notification(sender, instance, created, **kwargs):
    # Ignore save()s on existing Notifications
    if not created:
        return

    if instance.recipient.__class__.__name__ == 'User':
        # Serialize Notification instance
        serializer = NotificationSerializer(instance)

        # Publish RT event
        channel = '%s$%d' % ('/api/notifications/', instance.recipient.id)
        publish(channel,
            event_type='notification',
            data=serializer.data
        )
