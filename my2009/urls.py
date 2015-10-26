from django.conf.urls import patterns, include, url
from django.views.generic.base import RedirectView
from rest_framework import routers

from django.contrib import admin
admin.autodiscover()

from apps.users import views as userViews
from apps.events import views as eventViews
from apps.tasks import views as taskViews
from apps.notifications_api import views as notificationsViews

from apps.webapp import urls as webappUrls
from apps.files import urls as filesUrls
from apps.stats import urls as statsUrls

# API router
router = routers.DefaultRouter()
router.register(r'comments', userViews.CommentViewSet)
router.register(r'milestones', userViews.MilestoneViewSet)
router.register(r'roles', userViews.RoleViewSet)
router.register(r'taskforces', userViews.TaskForceViewSet)
router.register(r'teams', userViews.TeamViewSet)
router.register(r'users', userViews.UserViewSet)
router.register(r'user-profiles', userViews.UserProfileViewSet)
router.register(r'user-settings', userViews.UserSettingViewSet)
router.register(r'events', eventViews.EventViewSet)
router.register(r'tasks', taskViews.TaskViewSet)
router.register(r'notifications', notificationsViews.NotificationViewSet)

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'my2009.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    
    # Main page (redirect to web app)
    url(r'^$', RedirectView.as_view(pattern_name='webapp:app', permanent=False)),

    # Admin
    url(r'^admin/', include(admin.site.urls)),
    
    # Web app
    url(r'^app/', include(webappUrls, namespace='webapp')),
    
    # API
    url(r'^api/files/', include(filesUrls, namespace='files')),
    url(r'^api/stats/', include(statsUrls, namespace='stats')),
    url(r'^api/', include(router.urls)),
)
