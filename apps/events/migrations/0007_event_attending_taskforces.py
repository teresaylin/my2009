# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_team_logo_filename'),
        ('events', '0006_auto_20150710_1425'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='attending_taskforces',
            field=models.ManyToManyField(to='users.TaskForce', related_name='events_attending'),
            preserve_default=True,
        ),
    ]
