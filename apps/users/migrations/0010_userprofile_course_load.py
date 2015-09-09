# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_team_logo_filename'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='course_load',
            field=models.CharField(blank=True, max_length=1, choices=[('L', 'Light'), ('M', 'Medium'), ('H', 'Heavy')]),
            preserve_default=True,
        ),
    ]
