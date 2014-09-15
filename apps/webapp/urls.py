from django.core.urlresolvers import reverse
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
    url(r'^login$', authViews.login, {'template_name': 'webapp/login.html' }, name='login'),
    url(r'^logout$', authViews.logout_then_login, name='logout'),
    url(r'^change-password$', authViews.password_change, {
            'template_name': 'webapp/change-password.html',
            'post_change_redirect': 'webapp:change-password-done',
            'current_app': 'webapp'
        }, name='change-password'
    ),
    url(r'^change-password-done$', authViews.password_change_done, {
            'template_name': 'webapp/change-password-done.html',
        }, name='change-password-done'
    ),
    url(r'reset-password$', authViews.password_reset, {
            'template_name': 'webapp/reset-password.html',
            'post_reset_redirect': 'webapp:reset-password-done',
        }, name='reset-password'
    ),
    url(r'^reset-password-done$', authViews.password_reset_done, {
            'template_name': 'webapp/reset-password-done.html',
        }, name='reset-password-done'
    ),
)
