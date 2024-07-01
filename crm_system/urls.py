from django.contrib import admin
from django.views.generic import TemplateView
from django.urls import path, include

urlpatterns = [
    path('', TemplateView.as_view(template_name="home.html"), name='home'),
    path('admin/', admin.site.urls),
    path('', include('core.urls')),  # Включение URL-адресов приложения core
]