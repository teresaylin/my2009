# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0001_initial'),
        ('users', '0017_auto_20151102_1612'),
    ]

    operations = [
        migrations.AddField(
            model_name='team',
            name='course',
            field=models.ForeignKey(null=True, related_name='teams', to='courses.Course', blank=True),
        ),
    ]
