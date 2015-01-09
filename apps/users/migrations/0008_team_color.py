# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_auto_20150109_1556'),
    ]

    operations = [
        migrations.AddField(
            model_name='team',
            name='color',
            field=models.CharField(default='', max_length=20, blank=True),
            preserve_default=False,
        ),
    ]
