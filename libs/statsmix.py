import re
import json

import requests

class StatsMix:
    API_BASE = 'http://api.statsmix.com/api/v2/'

    def __init__(self, url):
        self.url = url

        # Get API key from URL
        m = re.match(r'https://www.statsmix.com/api_key/([a-z0-9]+)$', self.url)
        assert m
        self.key = m.group(1)

    def track(self, name, value=None, meta=None, generated_at=None):
        headers = {
            'X-StatsMix-Token': self.key
        }

        data = {
            'name': name,
        }

        if value:
            data['value'] = value

        if meta:
            data['meta'] = json.dumps(meta)
            
        if generated_at:
            data['generated_at'] = generated_at.isoformat()

        response = requests.post(self.API_BASE+'track', data=data, headers=headers)
