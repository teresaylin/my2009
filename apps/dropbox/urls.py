from django.conf.urls import patterns, include, url

from .views import AuthorizeView, StatusView

urlpatterns = patterns('',
    url(r'^authorize', AuthorizeView.as_view(), name='authorize'),
    url(r'^status', StatusView.as_view(), name='status'),
)
