# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('users', '0016_auto_20151102_1457'),
    ]

    operations = [
        migrations.CreateModel(
            name='CommentThreadSubscription',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', serialize=False, auto_created=True)),
                ('thread', models.ForeignKey(to='users.CommentThread')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='commentthreadsubscription',
            unique_together=set([('user', 'thread')]),
        ),
        migrations.AddField(
            model_name='commentthread',
            name='subscribed_users',
            field=models.ManyToManyField(through='users.CommentThreadSubscription', related_name='comment_threads_subscribed', to=settings.AUTH_USER_MODEL),
            preserve_default=True,
        ),
    ]
