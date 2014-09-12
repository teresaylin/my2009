from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile, Role, UserRoleMapping, TaskForce, Team, Milestone, Comment

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('picture_filename', 'phone_number', 'car')
        read_only_fields = ('picture_filename',)
        
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ('id', 'name',)

class UserRoleMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRoleMapping
        fields = ('role', 'status')
        
    role = RoleSerializer()
    
class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ('id', 'color', 'team_email')

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'profile', 'user_roles', 'teams')
        
    profile = UserProfileSerializer()
    user_roles = UserRoleMappingSerializer()
    teams = TeamSerializer()
    full_name = serializers.SerializerMethodField('getFullName')
    
    def getFullName(self, obj):
        return obj.first_name + ' ' + obj.last_name
    
class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ('id', 'name', 'end_date')

class ChildTaskForceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskForce
        fields = ('id', 'name', 'milestone', 'team', 'parent_task_force', 'members')
        
    milestone = MilestoneSerializer(read_only=True)
    members = UserSerializer(read_only=True)

class TaskForceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskForce
        fields = ('id', 'name', 'milestone_id', 'milestone', 'team', 'parent_task_force', 'children', 'members')
        
    milestone_id = serializers.WritableField(source='milestone_id', write_only=True)

    milestone = MilestoneSerializer(read_only=True)
    children = ChildTaskForceSerializer(read_only=True)
    members = UserSerializer(read_only=True)
    
class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ('thread', 'time', 'user', 'body')
        read_only_fields = ('time',)
        
    user = UserSerializer(read_only=True)