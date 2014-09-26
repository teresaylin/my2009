from django.conf.urls import patterns, include, url

from .views import *

urlpatterns = patterns('',
    url(r'^create-folder', CreateFolderView.as_view(), name='create-folder'),
    url(r'^metadata', MetadataView.as_view(), name='metadata'),
)
