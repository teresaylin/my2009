from datetime import timedelta
import json

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.db.models import Q
from django.contrib.auth.models import User

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ParseError
from rest_framework.response import Response

from notifications import notify

from apps.users.exceptions import UserNotFound, TeamNotFound, TaskForceNotFound, UserNotInTeam
from apps.users.models import Team, TaskForce

from apps.files.views import ModelWithFilesViewSetMixin

from libs import tracking

from ..exceptions import EventAlreadyHasAttendee, EventEndPrecedesStart
from ..models import Event, EventAttendee
from ..serializers import EventSerializer

class EventViewSet(ModelWithFilesViewSetMixin, viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    #filter_fields = ('teams',)
    ordering = ('start',)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Get time filter parameters
        start = self.request.QUERY_PARAMS.get('start', None)
        end = self.request.QUERY_PARAMS.get('end', None)

        try:
            # Filter by time range
            if start is not None:
                queryset = queryset.filter(Q(start__gt=start) | Q(end__gt=start))
            if end is not None:
                queryset = queryset.filter(start__lt=end)
        except ValidationError:
            raise ParseError('Invalid date')

        # Custom filter
        customStr = self.request.QUERY_PARAMS.get('custom', None)
        if customStr:
            try:
                custom = json.loads(customStr)
                custom['teams']
            except (ValueError, TypeError):
                raise ParseError('Invalid custom filter string')

            queryset = self.customFilter(queryset, custom)
        else:
            # Filter by team
            teamId = self.request.QUERY_PARAMS.get('team', None)
            if teamId:
                try:
                    team = Team.objects.get(id=teamId)
                except ValueError:
                    raise ParseError('Invalid team ID')
                except Team.DoesNotExist:
                    raise TeamNotFound()
                queryset = queryset.filter(Q(owner__teams__in=[team]) | Q(is_global=True))

            # Filter by user
            userId = self.request.QUERY_PARAMS.get('user', None)
            if userId:
                try:
                    user = User.objects.get(id=userId)
                except ValueError:
                    raise ParseError('Invalid user ID')
                except User.DoesNotExist:
                    raise UserNotFound()
                queryset = queryset.filter(
                    Q(owner=user) |
                    Q(is_global=True) |
                    Q(attendees__in=[user]) |
                    Q(attending_taskforces__in=user.taskforces.all())
                )

            # Filter by taskforce
            taskforceId = self.request.QUERY_PARAMS.get('taskforce', None)
            if taskforceId:
                try:
                    taskforce = TaskForce.objects.get(id=taskforceId)
                except ValueError:
                    raise ParseError('Invalid taskforce ID')
                except TaskForce.DoesNotExist:
                    raise TaskForceNotFound()
                queryset = queryset.filter(
                    Q(attending_taskforces__in=[taskforce]) |
                    Q(is_global=True) |
                    Q(attendees__in=taskforce.members.all())
                )

        # Remove duplicate results from joins
        queryset = queryset.distinct()

        # Optimizations
        queryset = queryset \
            .select_related('owner') \
            .select_related('comment_thread') \
            .prefetch_related('attendees') \
            .prefetch_related('attending_taskforces') \
            .prefetch_related('files')

        return queryset

    def customFilter(self, queryset, filterData):
        # Always include global events
        qFilter = Q(is_global=True)

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
                        Q(attendees__in=[self.request.user]) | \
                        Q(attending_taskforces__in=self.request.user.taskforces.all())

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
                            Q(attendees__in=teamUsers) | \
                            Q(attending_taskforces__in=TaskForce.objects.filter(members__in=teamUsers))
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
                                Q(attendees__in=[user]) | \
                                Q(attending_taskforces__in=user.taskforces.all())

                # Include taskforces
                try:
                    taskforces = teamData['taskforces']
                except KeyError:
                    taskforces = None
                if taskforces:
                    if taskforces == 'all':
                        # Include all taskforces
                        conditions |= \
                            Q(attending_taskforces__in=team.taskforces.all())
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
                            Q(attending_taskforces__in=queryIds)

                qFilter |= Q(team__id=teamId) & conditions

        return queryset.filter(qFilter)
    
    def pre_save(self, obj):
        # Set owner when object is created
        if not obj.pk:
            obj.owner = self.request.user

        # Check user belongs to team (accept if user is superuser)
        if not self.request.user.is_superuser and not obj.team in self.request.user.teams.all():
            raise UserNotInTeam()
        
        # Check start time precedes end time
        if obj.end < obj.start:
            raise EventEndPrecedesStart()

    def post_save(self, obj, created=False):
        if created:
            # Track event creation
            tracking.trackEventCreated(obj)
        
    @action(methods=['PUT'])
    def add_attendee(self, request, pk=None):
        event = self.get_object()
        
        # Get attendee User object
        try:
            userId = request.DATA.get('user_id', None)
            user = User.objects.get(id=userId)
        except User.DoesNotExist:
            raise UserNotFound()
        
        # Create EventAttendee object
        try:
            EventAttendee.objects.create(
                event=event,
                user=user
            )
        except IntegrityError:
            raise EventAlreadyHasAttendee()

        if user != request.user:
            # Generate notification for added user
            notify.send(request.user,
                recipient=user,
                verb='invited',
                action_object=user,
                target=event,
                description='You have been invited to an event'
            )
        
        return Response({})

    @action(methods=['PUT'])
    def add_attendee_taskforce(self, request, pk=None):
        event = self.get_object()
        
        # Get TaskForce object
        try:
            taskforceId = request.DATA.get('taskforce_id', None)
            taskforce = TaskForce.objects.get(id=taskforceId)
        except TaskForce.DoesNotExist:
            raise TaskForceNotFound()
        
        # Create EventAttendee objects for taskforce's users
        for user in taskforce.members.all():
            try:
                EventAttendee.objects.create(
                    event=event,
                    user=user
                )
            except IntegrityError:
                # Ignore members of the taskforce that are already attendees
                pass

        # Add TaskForce to attending list
        event.attending_taskforces.add(taskforce)
            
        # Return updated event
        return Response({})

    @action(methods=['PUT'])
    def remove_attendee(self, request, pk=None):
        event = self.get_object()
        
        # Get attendee User object
        try:
            userId = request.DATA.get('user_id', None)
            eventAttendee = EventAttendee.objects.get(event=event, user__id=userId)
        except EventAttendee.DoesNotExist:
            raise UserNotFound()
        
        # Remove EventAttendee object
        eventAttendee.delete()
        
        return Response({})

    @action(methods=['PUT'])
    def remove_attendee_taskforce(self, request, pk=None):
        event = self.get_object()

        # Get TaskForce object
        try:
            taskforceId = request.DATA.get('taskforce_id', None)
            taskforce = TaskForce.objects.get(id=taskforceId)
        except TaskForce.DoesNotExist:
            raise TaskForceNotFound()
        
        # Remove TaskForce from attendee list
        event.attending_taskforces.remove(taskforce)
        event.save()
        
        return Response({})

    @action(methods=['PUT'])
    def repeat(self, request, pk=None):
        event = self.get_object()
        
        # Get interval
        try:
            interval = int(request.DATA['interval'])
            if interval < 1:
                raise ValueError()
        except:
            raise ParseError('Invalid interval')

        # Get interval unit
        try:
            unit = request.DATA['intervalUnit']
            if not unit in ['d', 'w']:
                raise ValueError()
        except:
            raise ParseError('Invalid intervalUnit')

        # Get count
        try:
            count = int(request.DATA['count'])
            if count < 1:
                raise ValueError()
        except:
            raise ParseError('Invalid count')
        
        # Convert interval to timedelta object
        if unit == 'w':
            days = interval * 7
        else:
            days = interval
        intv = timedelta(days=days)
        
        for i in range(count):
            # Clone event
            newEvent = event.clone(request.user)

            # Adjust start/end times
            newEvent.start += intv * (i+1)
            newEvent.end += intv * (i+1)
            
            # Save
            newEvent.save()
        
        return Response({})
