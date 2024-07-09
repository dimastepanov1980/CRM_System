from django.urls import path
from django.conf.urls import handler404, handler400
from .views import login_view, bot_list_view, logout_view, home, BotCreateView, BotUpdateView, BotDetailView, message_list_view, user_list_view, webhook, AdminCreateView, AdminListView, AdminUpdateView
from django.shortcuts import render

def custom_404_view(request, exception):
    return render(request, '404.html', status=404)

def custom_400_view(request, exception):
    return render(request, '400.html', status=400)

urlpatterns = [
    path('', home, name='home'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('bots/', bot_list_view, name='bot_list'),
    path('bots/<int:bot_id>/users/', user_list_view, name='user_list'),
    path('bots/<int:bot_id>/messages/<str:user_id>/', message_list_view, name='message_list'),
    path('admin/add/', AdminCreateView.as_view(), name='admin_add'),
    path('admin/', AdminListView.as_view(), name='admin_list'),
    path('admin/<int:pk>/update/', AdminUpdateView.as_view(), name='admin_update'),
    path('webhook/', webhook, name='webhook'),
]

handler404 = custom_404_view
handler400 = custom_400_view