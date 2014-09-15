# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='File',
            fields=[
                ('id', models.AutoField(auto_created=True, serialize=False, primary_key=True, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('is_directory', models.BooleanField(default=False)),
                ('size', models.PositiveIntegerField()),
                ('modified_time', models.DateTimeField(auto_now_add=True)),
                ('icon', models.CharField(max_length=50)),
                ('owner', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
                ('parent', models.ForeignKey(null=True, blank=True, related_name='files', to='files.File')),
            ],
            options={
                'ordering': ('-is_directory', 'name'),
            },
            bases=(models.Model,),
        ),
    ]
