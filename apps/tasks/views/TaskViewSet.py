import json

from django.db.models import Count, Q
from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from notifications import notify

from libs.permissions.user_permissions import getUserObjectPermissions
from libs import tracking

from apps.users.exceptions import UserNotFound, TaskForceNotFound, TeamNotFound, UserNotInTeam
from apps.users.models import TaskForce, Team

from apps.files.views import ModelWithFilesViewSetMixin

from ..exceptions import TaskAlreadyAssignedToUser, TaskAlreadyAssignedToTaskForce
from ..models import Task
from ..serializers import TaskSerializer

class TaskViewSet(ModelWithFilesViewSetMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_fields = ('parent',)
    
    def get_queryset(self):
        queryset = super().get_queryset()

        # Exclude completed tasks
        completed = self.request.QUERY_PARAMS.get('exclude-completed', None)
        if completed:
            queryset = queryset.exclude(state='completed')

        # Custom filter
        customStr = self.request.QUERY_PARAMS.get('custom', None)
        if customStr:
            try:
                custom = json.loads(customStr)
                custom['teams']
            except (ValueError, TypeError):
                raise ParseError('Invalid custom filter string')

            queryset = self.customFilter(queryset, custom)

        # Filter by team
        teamId = self.request.QUERY_PARAMS.get('team', None)
        if teamId:
            try:
                team = Team.objects.get(id=teamId)
            except ValueError:
                raise ParseError('Invalid team ID')
            except Team.DoesNotExist:
                raise TeamNotFound()
            queryset = queryset.filter(owner__teams__in=[team])
        
        # Filter by user
        userId = self.request.QUERY_PARAMS.get('user', None)
        userIncludeOwned = self.request.QUERY_PARAMS.get('user-include-owned', False)
        if userId:
            # Get User object
            try:
                user = User.objects.get(id=userId)
            except User.DoesNotExist:
                raise UserNotFound()
            
            if userIncludeOwned:
                queryset = queryset.filter(
                    Q(assigned_users__in=[user]) |
                    Q(assigned_taskforces__in=user.taskforces.all()) |
                    Q(owner=user)
                )
            else:
                queryset = queryset.filter(
                    Q(assigned_users__in=[user]) |
                    Q(assigned_taskforces__in=user.taskforces.all())
                )

        # Filter by taskforce
        taskforceId = self.request.QUERY_PARAMS.get('taskforce', None)
        if taskforceId:
            # Get TaskForce object
            try:
                taskforce = TaskForce.objects.get(id=taskforceId)
            except TaskForce.DoesNotExist:
                raise TaskForceNotFound()
            
            queryset = queryset.filter(assigned_taskforces__in=[taskforce])

        # Filter by user ownership
        userOwnedId = self.request.QUERY_PARAMS.get('user-owned', None)
        if userOwnedId:
            # Get User object
            try:
                user = User.objects.get(id=userOwnedId)
            except User.DoesNotExist:
                raise UserNotFound()
            
            queryset = queryset.filter(owner=user)

        # Sort by due time; tasks with no due time are last in the list; completed tasks at end of list
        queryset = queryset \
            .annotate(null_due_time=Count('due_time')) \
            .order_by('state', '-null_due_time', 'due_time')

        # Remove duplicate results from joins
        queryset = queryset.distinct()

        # Optimizations
        queryset = queryset \
            .select_related('parent') \
            .select_related('owner') \
            .select_related('completed_by') \
            .select_related('comment_thread') \
            .prefetch_related('assigned_taskforces') \
            .prefetch_related('assigned_users') \
            .prefetch_related('files')

        return queryset

    def customFilter(self, queryset, filterData):
        qFilter = Q()

        for teamData in filterData['teams']:
            # Pull in entire team if array member is a team ID
            try:
                teamId = int(teamData)
                qFilter |= Q(team__id=teamId)
                continue
            except TypeError:
                pass

            # Partial team selection if array member is object
            try:
                teamId = int(teamData['id'])
            except (TypeError, KeyError):
                pass
            except ValueError:
                raise ParseError('Invalid team ID')
                
            if teamId:
                conditions = Q()

                # Get Team object
                try:
                    team = Team.objects.get(pk=teamId)
                except Team.DoesNotExist:
                    raise ParseError('Invalid team ID')

                # Include current user
                try:
                    includeCurUser = bool(teamData['currentUser'])
                except KeyError:
                    includeCurUser = False
                except ValueError:
                    raise ParseError('Invalid value for "currentUser" field')
                if includeCurUser:
                    conditions |= \
                        Q(owner=self.request.user) | \
                        Q(assigned_users__in=[self.request.user]) | \
                        Q(assigned_taskforces__in=self.request.user.taskforces.all())

                # Include users
                try:
                    users = teamData['users']
                except KeyError:
                    users = None
                if users:
                    if users == 'all':
                        # Include all users
                        teamUsers = team.users.all()
                        conditions |= \
                            Q(assigned_users__in=teamUsers) | \
                            Q(assigned_taskforces__in=TaskForce.objects.filter(members__in=teamUsers))
                    else:
                        # Partial user selection
                        try:
                            iter(users)
                        except TypeError:
                            raise ParseError('Expected array or string for "users" field')

                        for userId in users:
                            # Get user
                            try:
                                userId = int(userId)
                                user = User.objects.get(pk=userId)
                            except (ValueError, User.DoesNotExist):
                                raise ParseError('Invalid user ID')

                            conditions |= \
                                Q(assigned_users__in=[user]) | \
                                Q(assigned_taskforces__in=user.taskforces.all())

                # Include taskforces
                try:
                    taskforces = teamData['taskforces']
                except KeyError:
                    taskforces = None
                if taskforces:
                    if taskforces == 'all':
                        # Include all taskforces
                        conditions |= \
                            Q(assigned_taskforces__in=team.taskforces.all())
                    else:
                        # Partial taskforce selection
                        try:
                            taskforces.keys()
                        except TypeError:
                            raise ParseError('Expected object or string for "taskforces" field')

                        def processTfs(taskforces):
                            queryIds = []
                            for tfId, selected in taskforces.items():
                                # Get taskforce
                                try:
                                    tfId = int(tfId)
                                    tf = TaskForce.objects.get(pk=tfId)
                                except (ValueError, TaskForce.DoesNotExist):
                                    raise ParseError('Invalid taskforce ID')

                                if type(selected) == bool:
                                    # Full taskforce included
                                    queryIds += [tfId]

                                    # Get all descendants of taskforce
                                    # Note: this is hard-coded to 12 levels of nesting
                                    tfs = TaskForce.objects.all().filter(
                                        Q(parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force=tf) |
                                        Q(parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force__parent_task_force=tf)
                                    )
                                    queryIds += [tf.id for tf in tfs]

                                elif type(selected) == dict:
                                    queryIds += processTfs(selected)
                                else:
                                    raise ParseError('Expected boolean or object')
                            return queryIds
                        
                        queryIds = processTfs(taskforces)

                        conditions |= \
                            Q(assigned_taskforces__in=queryIds)

                qFilter |= Q(team__id=teamId) & conditions

        return queryset.filter(qFilter)
    
    def list(self, request, *args, **kwargs):
        if 'tree' in request.QUERY_PARAMS:
            return self.listTree(request)
        else:
            return super().list(request, *args, **kwargs)
        
    def listTree(self, request):
        """Return results as a tree, starting from any parent tasks that own tasks in the queryset"""
        
        tasks = {}
        rootTasks = []
        
        queryset = self.get_queryset()

        for task in queryset:
            taskData = TaskSerializer(task, context={'request': request}).data
            tasks[task.id] = taskData
            
        def processTask(task):
            if task.parent:
                if task.parent.id in tasks:
                    if not 'subtasks' in tasks[task.parent.id]:
                        tasks[task.parent.id]['subtasks'] = []
                        tasks[task.parent.id]['_hasPartialSubtasks'] = True
                    tasks[task.parent.id]['subtasks'].append(tasks[task.id])
                else:
                    parentData = TaskSerializer(task.parent, context={'request': request}).data
                    parentData['subtasks'] = [ tasks[task.id] ]
                    parentData['_hasPartialSubtasks'] = True
                    tasks[task.parent.id] = parentData
                    processTask(task.parent)
            else:
                rootTasks.append(tasks[task.id])

        for task in queryset:
            processTask(task)
        
        return Response(rootTasks)
    
    def pre_save(self, obj):
        # Set owner when object is created
        if not obj.pk:
            obj.owner = self.request.user

        # Check user belongs to team (accept if user is superuser)
        if not self.request.user.is_superuser and not obj.team in self.request.user.teams.all():
            raise UserNotInTeam()
        
        # Only allow subtask creation if user has update permission on parent
        if obj.parent:
            perm = getUserObjectPermissions(self.request.user, obj.parent)
            if not perm['update']:
                raise PermissionDenied()
        
    def post_save(self, obj, created=False):
        # Track task creation
        if created:
            tracking.trackTaskCreated(obj)
            
    @action(methods=['PUT'])
    def complete(self, request, pk=None):
        task = self.get_object()

        def completeTask(task):
            # Mark subtasks as completed
            for subtask in task.subtasks.all():
                completeTask(subtask)

            # Mark task as completed
            if task.state != task.COMPLETED:
                task.state = task.COMPLETED
                task.completed_by = self.request.user
                task.save()
                
        # Complete task and all subtasks
        completeTask(task)

        # Track task completion
        tracking.trackTaskCompleted(task)
        
        # Return updated task
        return Response(TaskSerializer(task, context={'request': request}).data)

    @action(methods=['PUT'])
    def uncomplete(self, request, pk=None):
        task = self.get_object()

        def uncompleteTask(task):
            # Mark subtasks as not completed
            for subtask in task.subtasks.all():
                uncompleteTask(subtask)

            # Mark task as not completed
            if task.state == task.COMPLETED:
                task.state = ''
                task.completed_by = None
                task.save()
                
        # Un-complete task and all subtasks
        uncompleteTask(task)

        # Return updated task
        return Response(TaskSerializer(task, context={'request': request}).data)

    @action(methods=['PUT'])
    def add_assigned_user(self, request, pk=None):
        task = self.get_object()
        
        # Get assigned User object
        try:
            userId = request.DATA.get('user_id', None)
            user = User.objects.get(id=userId)
        except User.DoesNotExist:
            raise UserNotFound()
        
        # Assign user to task
        if user in task.assigned_users.all():
            raise TaskAlreadyAssignedToUser()
        else:
            task.assigned_users.add(user)

        if user != request.user:
            # Generate notification for added user
            notify.send(request.user,
                recipient=user,
                verb='assigned',
                action_object=user,
                target=task,
                description='You have been assigned to a task'
            )
        
        return Response({})

    @action(methods=['PUT'])
    def remove_assigned_user(self, request, pk=None):
        task = self.get_object()
        
        # Get assigned User object
        try:
            userId = request.DATA.get('user_id', None)
            user = task.assigned_users.all().get(id=userId)
        except User.DoesNotExist:
            raise UserNotFound()
        
        # Remove user assignation
        task.assigned_users.remove(user)
        
        return Response({})

    @action(methods=['PUT'])
    def add_assigned_taskforce(self, request, pk=None):
        task = self.get_object()
        
        # Get TaskForce object
        try:
            taskforceId = request.DATA.get('taskforce_id', None)
            taskforce = TaskForce.objects.get(id=taskforceId)
        except TaskForce.DoesNotExist:
            raise TaskForceNotFound()
        
        # Assign task force to task
        if taskforce in task.assigned_taskforces.all():
            raise TaskAlreadyAssignedToTaskForce()
        else:
            task.assigned_taskforces.add(taskforce)
        
        return Response({})

    @action(methods=['PUT'])
    def remove_assigned_taskforce(self, request, pk=None):
        task = self.get_object()
        
        # Get TaskForce object
        try:
            taskforceId = request.DATA.get('taskforce_id', None)
            taskforce = TaskForce.objects.get(id=taskforceId)
        except TaskForce.DoesNotExist:
            raise TaskForceNotFound()
        
        # Remove task force assignation
        task.assigned_taskforces.remove(taskforce)
        
        return Response({})
