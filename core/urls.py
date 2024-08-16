from django.urls import path
from django.conf.urls import handler404, handler400
from .views import schedule_setup_view, get_schedules, get_schedule, apply_schedule, save_schedule, admin_dashboard_view, specialist_list_view, get_specialist_events, available_services_view, get_category_view, edit_category_view, delete_service_category_view, add_event_view, services_list_view, add_service_view, edit_service_view, delete_service_view, add_service_category_view, update_event_view, remove_event_view, specialist_detail_view, specialist_add_view, specialist_edit_view, specialist_delete_view, login_view, register, bot_list_view, logout_view, custom_404_view, custom_400_view, home, BotCreateView, BotUpdateView, BotDetailView, message_list_view, user_list_view, webhook, AdminCreateView, AdminListView, AdminUpdateView


urlpatterns = [
    path('', home, name='home'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('register/', register, name='register'),
 
    path('admin_dashboard/', admin_dashboard_view, name='admin_dashboard'),
    
    path('specialists/', specialist_list_view, name='specialist_list'),
    path('specialist/<uuid:uuid>/detail/', specialist_detail_view, name='specialist_detail'),
    path('add_specialist/', specialist_add_view, name='add_specialist'),
    path('specialist/<int:id>/edit/', specialist_edit_view, name='specialist_edit'),
    path('specialist/<int:id>/delete/', specialist_delete_view, name='specialist_delete'),


    path('services/', services_list_view, name='services_list'),
    path('add_service_category/', add_service_category_view, name='add_service_category'),
    path('add_service/', add_service_view, name='add_service'),
    path('edit_service/<int:service_id>/', edit_service_view, name='edit_service'),
    path('delete_service/<int:id>/', delete_service_view, name='delete_service'),
    path('get_category/<int:category_id>/', get_category_view, name='get_category'),
    path('delete_category/<int:category_id>/', delete_service_category_view, name='delete_category'),
    path('edit_category/<int:category_id>/', edit_category_view, name='edit_category'),


    path('add_event/', add_event_view, name='add_event'),  # добавить маршруты для событий
    path('specialist/<int:specialist_id>/available_services/', available_services_view, name='available_services'),    path('update_event/', update_event_view, name='update_event'),
    path('remove_event/', remove_event_view, name='remove_event'),
    path('specialist/<uuid:uuid>/events/', get_specialist_events, name='get_specialist_events'),

    path('schedule-setup/', schedule_setup_view, name='schedule_setup'),
    path('save_schedule/', save_schedule, name='save_schedule'),
    path('get_schedules/', get_schedules, name='get_schedules'),
    path('specialist/<uuid:uuid>/schedule/', get_schedule, name='get_schedule'),
    path('apply_schedule/', apply_schedule, name='apply_schedule'),
    
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