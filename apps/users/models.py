from django.db import models

from django.contrib.auth.models import User


class Team(models.Model):
    color = models.CharField(max_length=10, blank = False)
    team_email = models.EmailField(max_length=30)
    users = models.ManyToManyField(User, through='UserTeamMapping', related_name='teams')

    def __str__(self):
        return self.color

class UserTeamMapping(models.Model):
    user = models.ForeignKey(User)
    team = models.ForeignKey('Team')
    section = models.CharField(max_length=15, blank = True)

    def __str__(self):
        return self.user.first_name + " " + self.user.last_name + " ("+ self.user.email +") - " + self.team.color + "/ " + self.section
        #return u"%s %s (%s): %s" % (self.user.first_name, self.user.last_name, self.user.email, self.team.color)

class Role(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class UserRoleMapping(models.Model):
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

    user = models.OneToOneField(User, related_name='profile', primary_key=True)
    picture_filename = models.CharField(max_length=20, blank=True)
    phone_number = models.CharField(max_length=12)
    car = models.CharField(max_length=1, choices=CAR_CHOICES)

    def __str__(self):
        return str(self.user)

#    def get_picture(self):
#        return "http://"

##broke it when syncdb UserProfile: IntegrityError at /admin/users/userprofile/

##new, missing some column inputs, did not syncdb

class Milestone(models.Model):
    name = models.CharField(max_length=50)
    end_date = models.DateField()

    def __str__(self):
        return self.name + " " + str(self.end_date)

class TaskForce(models.Model):
    name = models.CharField(max_length=50, blank = False)
    milestone = models.ForeignKey('Milestone')
    team = models.ForeignKey('Team')
    parent_task_force = models.ForeignKey('TaskForce', blank = True, null = True, related_name='children')
    #URL

    def __str__(self):
        return self.name + "- " + str(self.milestone)

class UserTaskForceMapping(models.Model):
    user = models.ForeignKey(User)
    task_force = models.ForeignKey('TaskForce')

    def __str__(self):
        return str(self.user) + "- " + str(self.task_force)

class CommentThread(models.Model):
    pass
    
class Comment(models.Model):
    thread = models.ForeignKey(CommentThread, related_name='comments')
    time = models.DateTimeField()
    user = models.ForeignKey(User)
    body = models.TextField()