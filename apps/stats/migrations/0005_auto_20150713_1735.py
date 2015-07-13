# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0004_dailyglobalstats'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailyglobalstats',
            name='dropboxFiles',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='dailyteamstats',
            name='dropboxFiles',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
    ]
