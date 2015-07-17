# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0007_event_attending_taskforces'),
    ]

    operations = [
        migrations.AlterField(
            model_name='event',
            name='attending_taskforces',
            field=models.ManyToManyField(to='users.TaskForce', related_name='events_attending', blank=True),
        ),
    ]
