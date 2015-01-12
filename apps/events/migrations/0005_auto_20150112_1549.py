# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0004_event_files'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='is_global',
            field=models.BooleanField(default=False),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='event',
            name='comment_thread',
            field=models.OneToOneField(editable=False, to='users.CommentThread'),
        ),
    ]
