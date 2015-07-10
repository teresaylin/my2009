# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('stats', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyUserStats',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', primary_key=True, serialize=False)),
                ('date', models.DateField()),
                ('tasksOwned', models.PositiveIntegerField()),
                ('tasksAssigned', models.PositiveIntegerField()),
                ('eventsOwned', models.PositiveIntegerField()),
                ('eventsAttending', models.PositiveIntegerField()),
                ('user', models.ForeignKey(related_name='daily_stats', to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='dailyuserstats',
            unique_together=set([('user', 'date')]),
        ),
    ]
