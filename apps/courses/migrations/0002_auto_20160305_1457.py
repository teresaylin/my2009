# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='website_name',
            field=models.CharField(max_length=50, blank=True),
        ),
        migrations.AddField(
            model_name='course',
            name='website_url',
            field=models.URLField(blank=True),
        ),
    ]
