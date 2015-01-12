# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0005_auto_20141018_1359'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='comment_thread',
            field=models.OneToOneField(editable=False, to='users.CommentThread'),
        ),
    ]
