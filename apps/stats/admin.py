from django.contrib import admin

from .models import DailyTaskForceStats, DailyUserStats

class DailyTaskForceStatsAdmin(admin.ModelAdmin):
    list_display = ('date', 'taskforce', 'totalTasksAssigned', 'totalEventsAttending')
admin.site.register(DailyTaskForceStats, DailyTaskForceStatsAdmin)

class DailyUserStatsAdmin(admin.ModelAdmin):
    list_display = ('date', 'user', 'totalTasksAssigned', 'totalEventsAttending')
admin.site.register(DailyUserStats, DailyUserStatsAdmin)
