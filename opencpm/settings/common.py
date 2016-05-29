"""
Django settings for opencpm project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

ALLOWED_HOSTS = []

# Add request object to template contexts
from django.conf.global_settings import TEMPLATE_CONTEXT_PROCESSORS as TCP
TEMPLATE_CONTEXT_PROCESSORS = TCP + [
    'django.core.context_processors.request',
]

TEMPLATE_DIRS = (
    os.path.join(BASE_DIR, 'templates'),
)

# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'notifications',

    'apps.courses',
    'apps.events',
    'apps.files',
    'apps.tasks',
    'apps.users',
    'apps.user_tracking',
    'apps.webapp',
    'apps.stats',
    'apps.notifications_api',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.user_tracking.middleware.UserTrackingMiddleware',
    'libs.request_cache.middleware.RequestCacheMiddleware',
)

ROOT_URLCONF = 'opencpm.urls'

WSGI_APPLICATION = 'opencpm.wsgi.application'

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'

# Authentication URLs
LOGIN_URL = '/app/login'
LOGIN_REDIRECT_URL = '/app'

# REST framework setup
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
        'libs.permissions.rest.ObjectPermissions',
     ),
    'DEFAULT_FILTER_BACKENDS': (
        'libs.permissions.rest.ObjectPermissionsFilter',
        'rest_framework.filters.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter'
    ),
    'PAGINATE_BY_PARAM': 'page_size',
}

# django-pipeline config
INSTALLED_APPS += (
    'pipeline',
)

STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'
from django.conf.global_settings import STATICFILES_FINDERS as STATICFILES_FINDERS_DEFAULT
STATICFILES_FINDERS = STATICFILES_FINDERS_DEFAULT + [
    'pipeline.finders.PipelineFinder',
]

PIPELINE = {
    'JS_COMPRESSOR': 'pipeline.compressors.jsmin.JSMinCompressor',
    'CSS_COMPRESSOR': 'pipeline.compressors.cssmin.CSSMinCompressor',
    'CSSMIN_BINARY': 'cssmin',
    'JAVASCRIPT': {
        'app': {
            'source_filenames': (
              'js/app/app.js',
              'js/app/custom_filter.js',
              'js/app/events.js',
              'js/app/files.js',
              'js/app/navfilter.js',
              'js/app/notifications.js',
              'js/app/repositories.js',
              'js/app/stats.js',
              'js/app/tasks.js',
              'js/app/users.js',
            ),
            'output_filename': 'js/app.js',
        },
        'vendor': {
            'source_filenames': (
                'bower_components/jquery/dist/jquery.js',
                'bower_components/underscore/underscore.js',
                'bower_components/moment/moment.js',
                'bower_components/fullcalendar/dist/fullcalendar.js',
                'bower_components/angular/angular.js',
                'bower_components/angular-cookies/angular-cookies.js',
                'bower_components/angular-ui-router/release/angular-ui-router.js',
                'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
                'bower_components/angular-ui-indeterminate/dist/indeterminate.js',
                'bower_components/angular-ui-calendar/src/calendar.js',
                'bower_components/angular-file-upload/dist/angular-file-upload.js',
                'bower_components/angular-google-chart/ng-google-chart.js',
            ),
            'output_filename': 'js/vendor.js',
        }
    },
    'STYLESHEETS': {
        'app': {
            'source_filenames': (
                'css/bootstrap.css',
                'bower_components/font-awesome/css/font-awesome.min.css',
                'css/style.css',
                'css/style-responsive.css',
                'bower_components/fullcalendar/dist/fullcalendar.css',
                'css/app.css',
            ),
            'output_filename': 'css/app_all.css'
        }
    }
}

# Other settings
SITE_NAME = 'OpenCPM'

FILE_THUMBNAIL_CACHE_TIMEOUT = 5*60    # Number of seconds to cache Dropbox thumbnails
FILE_METADATA_CACHE_TIMEOUT = 60*60    # Number of seconds to cache Dropbox file metadata

# Django-RT settings
RT_SSE_HEARTBEAT = 30

# HACK: this fixes https://github.com/tomchristie/django-rest-framework/issues/2763
import django.core.handlers.wsgi as wsgi
from django.utils.six.moves.http_client import responses
wsgi.STATUS_CODE_TEXT = responses
