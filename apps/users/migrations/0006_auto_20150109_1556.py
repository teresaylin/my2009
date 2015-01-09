# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_auto_20141018_1410'),
    ]

    operations = [
        migrations.RenameField(
            model_name='team',
            old_name='color',
            new_name='name',
        ),
    ]
