# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('stats', '0007_auto_20150721_1406'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='dailyglobalstats',
            options={'permissions': (('can_view_stats', 'Can view all stats'),)},
        ),
    ]
