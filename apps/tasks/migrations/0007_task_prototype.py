# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0006_auto_20150112_1549'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='prototype',
            field=models.ForeignKey(blank=True, null=True, to='tasks.Task', related_name='prototype_for'),
            preserve_default=True,
        ),
    ]
