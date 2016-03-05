from django.db import models
from django.db.models.signals import post_save
from django.db import IntegrityError
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from apps.courses.models import Course

from libs.softdelete.models import SoftDeleteableModel

from random import SystemRandom
rngSource = SystemRandom()

class Team(models.Model):
    course = models.ForeignKey(Course, related_name='teams', null=True, blank=True)
    name = models.CharField(max_length=50, blank=False)
    team_email = models.EmailField(max_length=30)
    color = models.CharField(max_length=20, blank=True)
    logo_filename = models.CharField(max_length=30, blank=True)
    users = models.ManyToManyField(User, through='UserTeamMapping', related_name='teams')

    def __str__(self):
        return self.name

class UserTeamMapping(models.Model):
    class Meta:
        unique_together = ('user', 'team')

    user = models.ForeignKey(User)
    team = models.ForeignKey('Team')
    section = models.CharField(max_length=15, blank = True)

    def __str__(self):
        return self.user.first_name + " " + self.user.last_name + " ("+ self.user.email +") - " + self.team.name + "/ " + self.section
        #return u"%s %s (%s): %s" % (self.user.first_name, self.user.last_name, self.user.email, self.team.color)

class Role(models.Model):
    name = models.CharField(max_length=50)
    required_role = models.ForeignKey('Role', null=True, blank=True, related_name='required_by')
    user_assignable = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class UserRoleMapping(models.Model):
    class Meta:
        unique_together = ('user', 'role')

    user = models.ForeignKey(User, related_name="user_roles")
    role = models.ForeignKey('Role')
    status = models.CharField(max_length=50, blank = True)

    def __str__(self):
        return self.user.first_name + " " + self.user.last_name + " " + self.status

class UserProfile(models.Model):
    CAR_CHOICES = (
        ('Y', 'Yes'),
        ('N', 'No'),
    )

    COURSELOAD_CHOICES = (
        ('N', 'N/A'),
        ('L', 'Light'),
        ('M', 'Medium'),
        ('H', 'Heavy'),
    )

    user = models.OneToOneField(User, related_name='profile', primary_key=True)
    picture_filename = models.CharField(max_length=20, blank=True)
    phone_number = models.CharField(max_length=12)
    car = models.CharField(max_length=1, choices=CAR_CHOICES)
    course_load = models.CharField(max_length=1, choices=COURSELOAD_CHOICES, blank=True, default='N')

    def __str__(self):
        return str(self.user)
    
    @staticmethod
    def onUserSave(sender, **kwargs):
        # Create UserProfile object when a User is created
        user = kwargs['instance']
        if kwargs['created']:
            UserProfile.objects.create(
                user=user,
                picture_filename='',
                phone_number='',
                car='N'
            )
post_save.connect(UserProfile.onUserSave, sender=User)

class UserSetting(models.Model):
    class Meta:
        index_together = unique_together = (
            ('user', 'name'),
        )

    NAME_REGEX = r'^[a-zA-Z0-9.]+$'

    user = models.ForeignKey(User, related_name='settings')
    name = models.CharField(max_length=128, blank=False, validators=[
        RegexValidator(regex=NAME_REGEX)
    ])
    version = models.PositiveIntegerField()
    value = models.TextField()

class Milestone(models.Model):
    name = models.CharField(max_length=50)
    end_date = models.DateField()

    def __str__(self):
        return self.name + " " + str(self.end_date)

class TaskForce(SoftDeleteableModel):
    name = models.CharField(max_length=50, blank = False)
    milestone = models.ForeignKey('Milestone')
    team = models.ForeignKey('Team', related_name='taskforces')
    parent_task_force = models.ForeignKey('TaskForce', blank = True, null = True, related_name='children')
    members = models.ManyToManyField(User, related_name='taskforces')
    #URL

    def __str__(self):
        return self.name + "- " + str(self.milestone)
    
    def delete(self, *args, **kwargs):
        # Delete sub taskforces
        for tf in self.children.all():
            tf.delete()
            
        return super().delete(*args, **kwargs)

class UserTaskForceMapping(models.Model):
    user = models.ForeignKey(User)
    task_force = models.ForeignKey('TaskForce')

    def __str__(self):
        return str(self.user) + "- " + str(self.task_force)

class CommentThread(SoftDeleteableModel):
    class Meta:
        # Only allow one comment thread to be attached to an object
        unique_together = ('content_type', 'object_id')

    publicId = models.BigIntegerField(unique=True, null=True)

    # Generic object relation
    content_type = models.ForeignKey(ContentType, null=True)
    object_id = models.PositiveIntegerField(null=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    subscribed_users = models.ManyToManyField(User, through='CommentThreadSubscription', related_name='comment_threads_subscribed')
    
    def save(self, *args, **kwargs):
        if not self.publicId:
            # Assign random public ID
            while True:
                self.publicId = rngSource.randint(1, models.BigIntegerField.MAX_BIGINT)
                try:
                    super().save(*args, **kwargs)
                    break
                except IntegrityError:
                    # Retry in the super-rare event that the ID is already taken
                    continue
        else:
            super().save(*args, **kwargs)

class CommentThreadSubscription(models.Model):
    class Meta:
        unique_together = ('user', 'thread')

    user = models.ForeignKey(User)
    thread = models.ForeignKey(CommentThread)

class Comment(SoftDeleteableModel):
    thread = models.ForeignKey(CommentThread, related_name='comments')
    time = models.DateTimeField()
    user = models.ForeignKey(User)
    body = models.TextField()
