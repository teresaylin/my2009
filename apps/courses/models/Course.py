from django.db import models
from django.contrib.auth.models import User

from libs.softdelete.models import SoftDeleteableModel

class Course(SoftDeleteableModel):
    class Meta:
        app_label = 'courses'

    title = models.CharField(max_length=100)
    owner = models.ForeignKey(User, related_name='courses_owned')
    website_url = models.URLField(blank=True)
    website_name = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.title
