from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from notifications import notify

class Command(BaseCommand):
    help = 'Broadcast message to all users'

    def handle(self, *args, **options):
        user = User.objects.get(pk=1)
        notify.send(user, recipient=user, verb='another message')
