from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import Bot, User

class BotForm(forms.ModelForm):
    class Meta:
        model = Bot
        fields = ['name', 'token']

class LoginForm(AuthenticationForm):
    username = forms.EmailField(widget=forms.EmailInput(attrs={'autofocus': True}), label='Email')

    def confirm_login_allowed(self, user):
        if not user.is_active:
            raise forms.ValidationError(
                "This account is inactive.",
                code='inactive',
            )

class AdminForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'is_active']
        widgets = {
            'password': forms.PasswordInput(),
        }