from django.apps import AppConfig

class NotificationsApiConfig(AppConfig):
    name = 'apps.notifications_api'

    def ready(self):
        # Register signal receivers
        from . import signals
