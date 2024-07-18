from django.urls import path
from .views import customer_dashboard

urlpatterns = [
    path('', customer_dashboard, name='customer_dashboard'),
]