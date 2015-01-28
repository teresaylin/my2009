# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_team_color'),
    ]

    operations = [
        migrations.AddField(
            model_name='team',
            name='logo_filename',
            field=models.CharField(default='', max_length=30, blank=True),
            preserve_default=False,
        ),
    ]
