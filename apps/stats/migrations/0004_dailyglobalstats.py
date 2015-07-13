# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0003_auto_20150713_1413'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyGlobalStats',
            fields=[
                ('id', models.AutoField(serialize=False, auto_created=True, verbose_name='ID', primary_key=True)),
                ('date', models.DateField(unique=True)),
                ('tasksOpen', models.PositiveIntegerField()),
                ('eventsScheduled', models.PositiveIntegerField()),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
