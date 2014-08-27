from django.db import models

from django.contrib.auth.models import User


class Team(models.Model):
    color = models.CharField(max_length=10, blank = False)
    team_email = models.EmailField(max_length=30)
    users = models.ManyToManyField(User, through='UserTeamMapping')

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

    user = models.OneToOneField(User, related_name='profile', unique=True)
    phone_number = models.CharField(max_length=12)
#    picture = models.FileField() -- how to initialize photo functionality?
    car = models.CharField(max_length=1, choices=CAR_CHOICES)

    def __str__(self):
        return str(self.user) + "- " + self.phone_number + " " + self.car

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
    parent_task_force = models.ForeignKey('TaskForce', blank = True, null = True)
    #URL

    def __str__(self):
        return self.name + "- " + str(self.milestone)

class UserTaskForceMapping(models.Model):
    user = models.ForeignKey(User)
    task_force = models.ForeignKey('TaskForce')

    def __str__(self):
        return str(self.user) + "- " + str(self.task_force)

class Task(models.Model):
    name = models.CharField(max_length=50, blank=False)
    parent = models.ForeignKey('Task', blank=True, null=True)
    completed_by = models.DateField()
    order = models.IntegerField()
    description = models.TextField()
    due_date = models.DateField()
    # time_state = ?
    # completion_state = ?

    def __str__(self):
        return str(self.name)

class TaskAssigneeMap(models.Model):
    task = models.ForeignKey('Task', related_name='assignee_map', unique=True)
    task_forces = models.ManyToManyField('TaskForce')
    users = models.ManyToManyField(User)
    owner = models.ForeignKey(User, related_name='owned_task_assignee_maps')

class TaskComment(models.Model):
    task = models.ForeignKey('Task', related_name='task_comments')
    comment = models.ForeignKey('Comment')

class Comment(models.Model):
    user = models.ForeignKey(User)
    body = models.TextField()
