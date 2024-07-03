from django.contrib import admin
from .models import MasterAdmin, Client, Admin, Bot, Message

admin.site.register(MasterAdmin)
admin.site.register(Client)
admin.site.register(Admin)
admin.site.register(Bot)
#admin.site.register(Message)