# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0006_dailytaskforcestats_eventsattending'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailytaskforcestats',
            name='totalEventsAttending',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='dailytaskforcestats',
            name='totalTasksAssigned',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='dailyuserstats',
            name='totalEventsAttending',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='dailyuserstats',
            name='totalTasksAssigned',
            field=models.PositiveIntegerField(default=0),
            preserve_default=False,
        ),
    ]
