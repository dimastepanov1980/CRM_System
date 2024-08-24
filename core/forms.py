import unidecode
from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import Bot, User, Specialist, ServiceCategory, Service, Event

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
    services = forms.ModelMultipleChoiceField(
        queryset=Service.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        required=False
    )

    class Meta:
        model = Specialist
        fields = ['name', 'specialization', 'description', 'experience', 'email', 'phone_number', 'photo', 'services']
        widgets = {
            'photo': forms.ClearableFileInput(attrs={'class': 'form-control-file'}),
        }

class ServiceCategoryForm(forms.ModelForm):
    class Meta:
        model = ServiceCategory
        fields = ['name', 'description']

    def __init__(self, *args, **kwargs):
        company = kwargs.pop('company', None)
        super(ServiceCategoryForm, self).__init__(*args, **kwargs)
        if company:
            self.fields['name'].queryset = ServiceCategory.objects.filter(company=company)

class ServiceForm(forms.ModelForm):
    class Meta:
        model = Service
        fields = ['name', 'description', 'duration', 'price', 'category', 'specialists']
        widgets = {
            'specialists': forms.CheckboxSelectMultiple(),
        }
        help_texts = {
            'specialists': 'You can select multiple specialists for this service.',
        }

    def __init__(self, *args, **kwargs):
        company = kwargs.pop('company', None)
        super(ServiceForm, self).__init__(*args, **kwargs)
        if company:
            self.fields['category'].queryset = ServiceCategory.objects.filter(company=company)
            self.fields['specialists'].queryset = Specialist.objects.filter(company=company)
        self.fields['specialists'].required = False

class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = ['title', 'start', 'end', 'specialist', 'service']
        
    def __init__(self, *args, **kwargs):
        specialist = kwargs.pop('specialist', None)
        super(EventForm, self).__init__(*args, **kwargs)
        if specialist:
            self.fields['service'].queryset = specialist.service_specialists.all()

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