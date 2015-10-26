# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0012_auto_20150912_1737'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserSetting',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', serialize=False, auto_created=True)),
                ('name', models.CharField(max_length=128)),
                ('version', models.PositiveIntegerField()),
                ('value', models.TextField()),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='settings')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='usersetting',
            unique_together=set([('user', 'name')]),
        ),
        migrations.AlterIndexTogether(
            name='usersetting',
            index_together=set([('user', 'name')]),
        ),
    ]
