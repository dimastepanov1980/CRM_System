from django.urls import path
from django.conf.urls import handler404, handler400
from .views import admin_dashboard, specialist_list_view, add_event_view, update_event_view, remove_event_view, specialist_detail_view, add_specialist_view, login_view, register, bot_list_view, logout_view, custom_404_view, custom_400_view, home, BotCreateView, BotUpdateView, BotDetailView, message_list_view, user_list_view, webhook, AdminCreateView, AdminListView, AdminUpdateView


urlpatterns = [
    path('', home, name='home'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('register/', register, name='register'),

    
    path('admin_dashboard/', admin_dashboard, name='admin_dashboard'),
    path('specialists/', specialist_list_view, name='specialist_list'),
    path('specialist/<uuid:uuid>/detail/', specialist_detail_view, name='specialist_detail'),
    path('add_specialist/', add_specialist_view, name='add_specialist'),

    path('add_event/', add_event_view, name='add_event'),  # добавить маршруты для событий
    path('update_event/', update_event_view, name='update_event'),
    path('remove_event/', remove_event_view, name='remove_event'),

    
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