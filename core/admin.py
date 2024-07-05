from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Admin, Bot, Message
from django import forms

class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2'),
        }),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    ordering = ('username',)

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