from django.conf.urls import patterns, include, url
from rest_framework import routers

from apps.users import views

from django.contrib import admin
admin.autodiscover()

from apps.webapp import urls as WebappUrls

# API router
router = routers.DefaultRouter()
router.register(r'tasks', views.TaskViewSet)
router.register(r'teams', views.TeamViewSet)
router.register(r'users', views.UserViewSet)

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'my2009.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
    
    url(r'^webapp/', include(WebappUrls, namespace='webapp')),
    
    url(r'^api/', include(router.urls)),
)
