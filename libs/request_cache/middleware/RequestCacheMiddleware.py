from ..RequestCache import RequestCache

class RequestCacheMiddleware(object):
    """This middleware injects a per-request cache into new requests"""

    def process_request(self, request):
        request.appCache = RequestCache()
        return None
