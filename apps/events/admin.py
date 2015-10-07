from django.contrib import admin

from .models import Event, EventAttendee

class EventAttendeeInline(admin.TabularInline):
    model = EventAttendee
    extra = 1

class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'team')
    inlines = (EventAttendeeInline,)
admin.site.register(Event, EventAdmin)
