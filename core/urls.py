from django.urls import path
from django.contrib.auth.views import LogoutView
from .views import BotListView, BotCreateView, login_view, webhook

urlpatterns = [
    path('login/', login_view, name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('bots/', BotListView.as_view(), name='bot-list'),
    path('bots/add/', BotCreateView.as_view(), name='bot-add'),
    path('webhook/', webhook, name='webhook'),

]