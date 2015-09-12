# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_userprofile_course_load'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='course_load',
            field=models.CharField(blank=True, max_length=1, default='', choices=[('L', 'Light'), ('M', 'Medium'), ('H', 'Heavy')]),
            preserve_default=True,
        ),
    ]
