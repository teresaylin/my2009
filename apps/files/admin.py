from django.contrib import admin

from .models import File

class FileAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_directory')
admin.site.register(File, FileAdmin)