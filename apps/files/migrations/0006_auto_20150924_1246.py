# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('files', '0005_auto_20141007_1817'),
    ]

    operations = [
        migrations.AlterField(
            model_name='config',
            name='deltaCursor',
            field=models.CharField(max_length=4096, null=True),
            preserve_default=True,
        ),
    ]
