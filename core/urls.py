from django.urls import path
from .views import login_view, bot_list_view, logout_view, BotCreateView, BotUpdateView, BotDetailView, message_list_view, user_list_view, message_list_view, webhook, AdminCreateView, AdminListView, AdminUpdateView

urlpatterns = [
    path('', login_view, name='login'),
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