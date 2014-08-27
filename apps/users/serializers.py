from django.contrib.auth.models import User
from rest_framework import serializers

from .models import UserProfile, Role, UserRoleMapping, Task, Team

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('phone_number', 'car')
        
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ('name',)

class UserRoleMappingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRoleMapping
        fields = ('role', 'status')
        
    role = RoleSerializer()
    
class TeamSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Team
        fields = ('color', 'team_email')

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

    
class TaskSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Task
        fields = ('url', 'id', 'name', 'parent', 'completed_by', 'order', 'description', 'due_date')