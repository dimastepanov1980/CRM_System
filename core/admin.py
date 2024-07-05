from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Admin, Bot, Message
from django import forms

class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions', 'is_admin', 'is_master_admin')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
    list_display = ('email', 'name', 'is_staff')
    search_fields = ('email', 'name')
    ordering = ('email',)
    readonly_fields = ('date_joined',)

class BotForm(forms.ModelForm):
    class Meta:
        model = Bot
        fields = ['name', 'token', 'admin']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['admin'].queryset = Admin.objects.filter(user__is_admin=True)

class BotAdmin(admin.ModelAdmin):
    form = BotForm

admin.site.register(User, UserAdmin)
admin.site.register(Admin)
admin.site.register(Bot)
admin.site.register(Message)