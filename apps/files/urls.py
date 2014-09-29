from django.conf.urls import patterns, include, url

from .views import *

urlpatterns = patterns('',
    url(r'^create-folder/$', CreateFolderView.as_view(), name='create-folder'),
    url(r'^metadata/$', MetadataView.as_view(), name='metadata'),
    url(r'^previews(?P<path>/.+)$', PreviewView.as_view(), name='preview'),
    url(r'^thumbnails(?P<path>/.+)/(?P<size>[a-z][a-z]?)\.(?P<format>[a-z]+)$', ThumbnailView.as_view(), name='thumbnail'),
)
