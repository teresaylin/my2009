# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0001_initial'),
        ('users', '0015_auto_20151102_1456'),
    ]

    operations = [
        migrations.AddField(
            model_name='commentthread',
            name='content_type',
            field=models.ForeignKey(to='contenttypes.ContentType', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='commentthread',
            name='object_id',
            field=models.PositiveIntegerField(null=True),
            preserve_default=True,
        ),
        migrations.AlterUniqueTogether(
            name='commentthread',
            unique_together=set([('content_type', 'object_id')]),
        ),
    ]
