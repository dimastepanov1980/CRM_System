from django.urls import path
from .views import ClientListView, ClientDetailView, HomePageView, ClientCreateView, AdminCreateView, BotCreateView, MessageListView, receive_message

urlpatterns = [
    path('', HomePageView.as_view(), name='home'),  # Маршрут для основной страницы
    path('clients/', ClientListView.as_view(), name='client-list'),
    path('clients/<int:pk>/', ClientDetailView.as_view(), name='client-detail'),
    path('clients/add/', ClientCreateView.as_view(), name='client-add'),
    path('admins/add/', AdminCreateView.as_view(), name='admin-add'),
    path('bots/add/', BotCreateView.as_view(), name='bot-add'),
    path('messages/', MessageListView.as_view(), name='message-list'),
    path('receive_message/', receive_message, name='receive_message'),

]