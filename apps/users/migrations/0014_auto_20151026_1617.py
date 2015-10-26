# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0013_auto_20151022_1613'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usersetting',
            name='name',
            field=models.CharField(validators=[django.core.validators.RegexValidator(regex='^[a-zA-Z0-9.]+$')], max_length=128),
            preserve_default=True,
        ),
    ]
