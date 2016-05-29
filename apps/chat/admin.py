from django.contrib import admin

from .models import Room, RoomUser

class RoomAdmin(admin.ModelAdmin):
    pass
admin.site.register(Room, RoomAdmin)

class RoomUserAdmin(admin.ModelAdmin):
    list_display = ('room', 'user', 'status')
admin.site.register(RoomUser, RoomAdmin)
