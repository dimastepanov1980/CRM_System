from django.urls import path
from .views import test_view, ClientListView, ClientDetailView, HomePageView, ClientCreateView, AdminCreateView, BotCreateView, MessageListView, webhook

urlpatterns = [
    # path('test/', test_view, name='test'),  # Закомментировано или удалено
    path('', HomePageView.as_view(), name='home'),  # Маршрут для основной страницы
    path('clients/', ClientListView.as_view(), name='client-list'),
    path('clients/<int:pk>/', ClientDetailView.as_view(), name='client-detail'),
    path('clients/add/', ClientCreateView.as_view(), name='client-add'),
    path('admins/add/', AdminCreateView.as_view(), name='admin-add'),
    path('bots/add/', BotCreateView.as_view(), name='bot-add'),
    path('webhook/', webhook, name='webhook'),
    path('messages/', MessageListView.as_view(), name='message-list'),
]