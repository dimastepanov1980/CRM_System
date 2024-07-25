import unidecode
from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import Bot, User, Specialist

class BotForm(forms.ModelForm):
    class Meta:
        model = Bot
        fields = ['name', 'token']

class RegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    name = forms.CharField(max_length=100, required=True)
    company_name = forms.CharField(max_length=100, required=True, help_text='Название вашей компании (только латиница)')

    class Meta:
        model = User
        fields = ['name', 'email', 'password1', 'password2']

    def save(self, commit=True):
        user = super(RegistrationForm, self).save(commit=False)
        user.email = self.cleaned_data['email']
        user.name = self.cleaned_data['name']
        user.role = 'MasterAdmin'
        if commit:
            user.save()
        return user
    
    def clean_company_name(self):
        company_name = self.cleaned_data['company_name']
        company_name_latin = unidecode.unidecode(company_name)
        company_name_latin = company_name_latin.replace(" ", "-").lower()
        return company_name_latin

    
class SpecialistForm(forms.ModelForm):
    class Meta:
        model = Specialist
        fields = ['name', 'specialization', 'description', 'experience', 'company', 'email']

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

class LoginForm(AuthenticationForm):
    username = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'shadow form-control', 'placeholder': 'Username'})
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'shadow form-control', 'placeholder': 'Password'})
    )        