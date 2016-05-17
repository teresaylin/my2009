# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import libs.ImageMaxSizeValidator


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0003_auto_20160305_1552'),
    ]

    operations = [
        migrations.AlterField(
            model_name='course',
            name='logo',
            field=models.ImageField(blank=True, validators=[libs.ImageMaxSizeValidator.ImageMaxSizeValidator(max_w=100, max_h=50)], null=True, upload_to='', height_field='logo_height', width_field='logo_width'),
        ),
    ]
