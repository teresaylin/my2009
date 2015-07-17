# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0005_auto_20150713_1735'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailytaskforcestats',
            name='eventsAttending',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
    ]
