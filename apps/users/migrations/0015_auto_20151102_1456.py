# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0014_auto_20151026_1617'),
    ]

    operations = [
        migrations.AlterField(
            model_name='taskforce',
            name='team',
            field=models.ForeignKey(to='users.Team', related_name='taskforces'),
            preserve_default=True,
        ),
    ]
