# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_auto_20150912_1737'),
        ('tasks', '0008_auto_20150710_1425'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='team',
            field=models.ForeignKey(to='users.Team', blank=True, null=True, related_name='tasks'),
            preserve_default=True,
        ),
    ]
