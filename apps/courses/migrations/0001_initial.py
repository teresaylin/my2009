# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Course',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, verbose_name='ID', serialize=False)),
                ('alive', models.BooleanField(editable=False, default=True)),
                ('title', models.CharField(max_length=100)),
                ('owner', models.ForeignKey(to=settings.AUTH_USER_MODEL, related_name='courses_owned')),
            ],
        ),
    ]
