# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import apps.dropbox.models.UserDropbox
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('files', '0001_initial'),
        ('auth', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FileDropbox',
            fields=[
                ('file', models.OneToOneField(serialize=False, related_name='file_dropbox', primary_key=True, to='files.File')),
                ('path', models.CharField(max_length=1000)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='UserDropbox',
            fields=[
                ('user', models.OneToOneField(serialize=False, related_name='user_dropbox', primary_key=True, to=settings.AUTH_USER_MODEL)),
                ('dropbox_uid', models.PositiveIntegerField()),
                ('access_token', models.CharField(max_length=64)),
                ('dropbox_email', models.CharField(default='', max_length=255)),
                ('valid', models.BooleanField(default=False)),
                ('last_validated', models.DateTimeField(default=apps.dropbox.models.UserDropbox.getMinTime)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
