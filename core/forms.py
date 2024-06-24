from django import forms
from .models import Client, Admin, Bot

class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = ['name', 'email', 'password']

class AdminForm(forms.ModelForm):
    class Meta:
        model = Admin
        fields = ['client', 'name', 'email', 'password']

class BotForm(forms.ModelForm):
    class Meta:
        model = Bot
        fields = ['client', 'name', 'token']