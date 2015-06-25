# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_team_logo_filename'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyTeamStats',
            fields=[
                ('id', models.AutoField(serialize=False, verbose_name='ID', auto_created=True, primary_key=True)),
                ('date', models.DateField()),
                ('tasksOpen', models.PositiveIntegerField()),
                ('eventsScheduled', models.PositiveIntegerField()),
                ('team', models.ForeignKey(related_name='daily_stats', to='users.Team')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='dailyteamstats',
            unique_together=set([('team', 'date')]),
        ),
    ]
