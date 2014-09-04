from django.conf.urls import patterns, include, url

from .views import *

urlpatterns = patterns('',
    url(r'^add-dropbox-files', AddDropboxFilesView.as_view(), name='add-dropbox-files'),
    url(r'^authorize', AuthorizeView.as_view(), name='authorize'),
    url(r'^metadata', MetadataView.as_view(), name='metadata'),
    url(r'^status', StatusView.as_view(), name='status'),
)
