from django.apps import AppConfig
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import Permission

class StatsConfig(AppConfig):
    name = 'apps.stats'

    def ready(self):
        # Create generic "view stats" permission

        ct, created = ContentType.objects.get_or_create(
            app_label='stats',
            model='none'
        )

        Permission.objects.get_or_create(
            name='Can view stats',
            content_type=ct,
            codename='can_view_stats'
        )
