from .prod import *

import os
from urllib.parse import urlparse

# Parse database configuration from $DATABASE_URL
import dj_database_url
DATABASES = {
    'default': dj_database_url.config()
}

# Honor the 'X-Forwarded-Proto' header for request.is_secure()
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Allow all host headers
ALLOWED_HOSTS = ['*']

# Static asset configuration
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATIC_URL = '/static/'

# Mailgun SMTP configuration
if 'MAILGUN_SMTP_SERVER' in os.environ:
    EMAIL_HOST = os.environ['MAILGUN_SMTP_SERVER']
    EMAIL_PORT = int(os.environ['MAILGUN_SMTP_PORT'])
    EMAIL_HOST_USER = os.environ['MAILGUN_SMTP_LOGIN']
    EMAIL_HOST_PASSWORD = os.environ['MAILGUN_SMTP_PASSWORD']
    EMAIL_USE_TLS = True

# Dropbox configuration
DROPBOX_APP_KEY = os.environ['DROPBOX_APP_KEY']
DROPBOX_APP_SECRET = os.environ['DROPBOX_APP_SECRET']
DROPBOX_ACCESS_TOKEN = os.environ['DROPBOX_ACCESS_TOKEN']
DROPBOX_BASE_PATH = os.environ['DROPBOX_BASE_PATH']

# Cache configuration
redis_url = urlparse(os.environ.get('REDISCLOUD_URL'))
CACHES = {
    'default': {
        'BACKEND': 'redis_cache.cache.RedisCache',
        'LOCATION': '%s:%s:0' % (redis_url.hostname, redis_url.port),
        'OPTIONS': {
            'CLIENT_CLASS': 'redis_cache.client.DefaultClient',
            'PASSWORD': redis_url.password,
        }
    }
}

if 'STATSMIX_URL' in os.environ:
    STATSMIX_URL = os.environ['STATSMIX_URL']

# Heroku logging
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
        }
    }
}

# Django-RT
RT_REDIS_HOST = redis_url.hostname
RT_REDIS_PORT = redis_url.port
RT_REDIS_PASSWORD = redis_url.password
