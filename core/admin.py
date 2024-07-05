from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Admin, Bot, Message
from django import forms

class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_admin', 'is_master_admin', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'is_admin', 'is_master_admin'),
        }),
    )
    list_display = ('email', 'name', 'is_admin', 'is_master_admin', 'is_staff', 'is_active')
    search_fields = ('email', 'name')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions')

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