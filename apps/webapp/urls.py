from django.conf.urls import patterns, include, url
import django.contrib.auth.views as authViews

from .views import *

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'my2009.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    # Main app page
    url(r'^$', AppView.as_view(), name="app"),

    # Authentication
    url(r'^login$', authViews.login, {'template_name': 'webapp/login.html' }, name="login"),
    url(r'^logout$', authViews.logout_then_login, name="logout"),
)
