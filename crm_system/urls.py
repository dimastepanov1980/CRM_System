from django.contrib import admin
from core import views
from django.urls import path, include

urlpatterns = [
    path('', views.home, name='home'),
    path('admin/', admin.site.urls),
    path('', include('core.urls')),  # Включение URL-адресов приложения core
]