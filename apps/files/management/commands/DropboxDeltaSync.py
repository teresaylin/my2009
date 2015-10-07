from django.core.management.base import BaseCommand, CommandError

from ...tasks import deltaSync

class Command(BaseCommand):
    help = 'Manual Dropbox sync'

    def handle(self, *args, **options):
        deltaSync()
