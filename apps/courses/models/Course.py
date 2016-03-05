from django.db import models
from django.contrib.auth.models import User

from libs.softdelete.models import SoftDeleteableModel
from libs.ImageMaxSizeValidator import ImageMaxSizeValidator

class Course(SoftDeleteableModel):
    class Meta:
        app_label = 'courses'

    title = models.CharField(max_length=100)
    owner = models.ForeignKey(User, related_name='courses_owned')
    website_url = models.URLField(blank=True)
    website_name = models.CharField(max_length=50, blank=True)

    logo = models.ImageField(width_field='logo_width', height_field='logo_height', validators=[
        ImageMaxSizeValidator(max_w=100, max_h=50)
    ], null=True, blank=True)
    logo_width = models.PositiveIntegerField(null=True, editable=False)
    logo_height = models.PositiveIntegerField(null=True, editable=False)

    def __str__(self):
        return self.title
