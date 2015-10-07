# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_auto_20150912_1737'),
        ('events', '0008_auto_20150717_1452'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='team',
            field=models.ForeignKey(related_name='events', null=True, blank=True, to='users.Team'),
            preserve_default=True,
        ),
    ]
