class RequestCache:
    """A simple per-request, in-memory cache for commonly used SQL queries"""

    def __init__(self):
        self._userTaskforcesAll = {}

    def getUserTaskforcesAll(self, user):
        if not user.pk in self._userTaskforcesAll:
            # Cache miss
            self._userTaskforcesAll[user.pk] = user.taskforces.all()

        return self._userTaskforcesAll[user.pk]
