# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import libs.ImageMaxSizeValidator


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0002_auto_20160305_1457'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='logo',
            field=models.ImageField(height_field='logo_height', width_field='logo_width', upload_to='', blank=True, null=True, validators=[libs.ImageMaxSizeValidator.ImageMaxSizeValidator(max_h=50, max_w=100)]),
        ),
        migrations.AddField(
            model_name='course',
            name='logo_height',
            field=models.PositiveIntegerField(editable=False, null=True),
        ),
        migrations.AddField(
            model_name='course',
            name='logo_width',
            field=models.PositiveIntegerField(editable=False, null=True),
        ),
    ]
