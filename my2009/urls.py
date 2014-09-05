from django.conf.urls import patterns, include, url
from rest_framework import routers

from django.contrib import admin
admin.autodiscover()

from apps.users import views as userViews
from apps.events import views as eventViews
from apps.files import views as fileViews

from apps.webapp import urls as webappUrls
from apps.dropbox import urls as dropboxUrls

# API router
router = routers.DefaultRouter()
router.register(r'tasks', userViews.TaskViewSet)
router.register(r'taskforces', userViews.TaskForceViewSet)
router.register(r'teams', userViews.TeamViewSet)
router.register(r'users', userViews.UserViewSet)
router.register(r'user-profiles', userViews.UserProfileViewSet)
router.register(r'events', eventViews.EventViewSet)
router.register(r'files', fileViews.FileViewSet)

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'my2009.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    
    url(r'^webapp/', include(webappUrls, namespace='webapp')),
    
    url(r'^api/', include(router.urls)),
    url(r'^dropbox/', include(dropboxUrls, namespace='dropbox'))
)
