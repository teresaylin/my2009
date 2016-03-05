#!/usr/bin/env python3

from os import environ
from opencpm.wsgi import application
import logging
from waitress import serve

threads = environ.get('WEB_CONCURRENCY', 2)
port = environ['PORT']

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger('waitress')
logger.setLevel(logging.INFO)

serve(application, threads=threads, port=port)
