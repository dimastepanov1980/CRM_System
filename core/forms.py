from django import forms
from django.contrib.auth.forms import AuthenticationForm
from .models import Bot, Client, Admin

class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = ['name', 'email', 'password']

class LoginForm(forms.Form):
    email = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'form-control'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control'}))

class BotForm(forms.ModelForm):
    class Meta:
        model = Bot
        fields = ['name', 'token', 'client']

class AdminForm(forms.ModelForm):
    class Meta:
        model = Admin
        fields = ['client', 'name', 'email', 'password']