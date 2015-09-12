# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_auto_20150912_1202'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='course_load',
            field=models.CharField(choices=[('N', 'N/A'), ('L', 'Light'), ('M', 'Medium'), ('H', 'Heavy')], default='N', max_length=1, blank=True),
            preserve_default=True,
        ),
    ]
