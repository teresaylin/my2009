# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_team_logo_filename'),
        ('stats', '0002_auto_20150710_1425'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyTaskForceStats',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('date', models.DateField()),
                ('tasksAssigned', models.PositiveIntegerField()),
                ('taskforce', models.ForeignKey(related_name='daily_stats', to='users.TaskForce')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='dailytaskforcestats',
            unique_together=set([('taskforce', 'date')]),
        ),
    ]
