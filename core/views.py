import json
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import login, logout
from django.template.loader import render_to_string
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.http import JsonResponse, HttpResponseBadRequest
from django.urls import reverse_lazy
from django.views.decorators.csrf import csrf_exempt
from .forms import LoginForm, BotForm, AdminForm, RegistrationForm, SpecialistForm, ServiceCategoryForm, ServiceForm, EventForm
from .models import Bot, User, Message, Company, UserCompanyRole, Specialist, Company, Event, Service, ServiceCategory, WorkSchedule, ScheduleEntry
from django.utils.dateparse import parse_date
from django.db.models import Max
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def home(request):
    return render(request, 'core/home.html')

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('admin_dashboard')
    else:
        form = LoginForm()
    return render(request, 'core/login.html', {'form': form})

def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.role = 'MasterAdmin'
            user.is_active = True
            user.save()

            # Создание компании
            company_name = form.cleaned_data.get('company_name')
            unique_url = form.clean_company_name()  # Используем очищенное название компании
            company = Company.objects.create(name=company_name, unique_url=unique_url, owner=user)

            login(request, user)
            return redirect('admin_dashboard')
    else:
        form = RegistrationForm()
    return render(request, 'core/register.html', {'form': form})

@login_required
def admin_dashboard_view(request):
    user = request.user
    company = Company.objects.get(owner=user)
    specialists = Specialist.objects.filter(company=company)
    specialist_form = SpecialistForm()  # Создаем экземпляр формы
    services = Service.objects.filter(company=company)
    service_form = ServiceForm()
    service_category_form = ServiceCategoryForm()
    
    if request.method == 'POST':
        specialist_form = SpecialistForm(request.POST)
        if specialist_form.is_valid():
            specialist = specialist_form.save(commit=False)
            specialist.company = company
            specialist.save()

            return JsonResponse({
                'success': True,
                'specialist': {
                    'uuid': specialist.uuid,
                    'name': specialist.name,
                    'specialization': specialist.specialization
                }
            })
        else:
            return JsonResponse({'success': False, 'errors': specialist_form.errors})

    return render(request, 'core/admin_dashboard.html', {
        'specialists': specialists,
        'services': services,
        'service_form': service_form,
        'service_category_form': service_category_form,
        'form': specialist_form
    })

# -------------------------------------------------
# ------------- < Servises > ----------------------

@login_required
def add_service_view(request):
    if request.method == 'POST':
        form = ServiceForm(request.POST)
        if form.is_valid():
            service = form.save(commit=False)
            service.company = request.user.companies.first()
            service.save()  # Сначала сохраняем объект сервиса
            form.save_m2m()  # Затем сохраняем связи Many-to-Many
            for specialist in form.cleaned_data['specialists']:
                specialist.services.add(service)  # Обновление связи у специалиста
            return JsonResponse({
                'success': True,
                'service': {
                    'id': service.id,
                    'name': service.name,
                    'description': service.description,
                    'duration': service.duration,
                    'price': service.price,
                    'category': service.category.name,
                    'specialists': list(service.specialists.values('uuid', 'name'))  # Возвращаем список специалистов
                }
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = ServiceForm(company=request.user.companies.first())
    return render(request, 'core/add_service.html', {'form': form})

@login_required
def services_list_view(request):
    user = request.user
    company = Company.objects.get(owner=user)
    
    services = Service.objects.filter(company=company)
    categories = ServiceCategory.objects.filter(company=company)
    service_form = ServiceForm()
    service_category_form = ServiceCategoryForm()

    return render(request, 'core/services_list.html', {
        'categories': categories,
        'services': services,
        'service_form': service_form,
        'service_category_form': service_category_form,
    })

@login_required
def edit_service_view(request, service_id):
    service = get_object_or_404(Service, id=service_id)
    if request.method == 'POST':
        form = ServiceForm(request.POST, instance=service, company=request.user.companies.first())
        if form.is_valid():
            service = form.save(commit=False)
            service.save()
            form.save_m2m()

            # Удаление всех текущих связей
            for specialist in Specialist.objects.filter(company=request.user.companies.first()):
                specialist.services.remove(service)

            # Добавление новых связей
            for specialist in form.cleaned_data['specialists']:
                specialist.services.add(service)

            return JsonResponse({
                'success': True,
                'service': {
                    'id': service.id,
                    'name': service.name,
                    'description': service.description,
                    'duration': service.duration,
                    'price': service.price,
                }
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = ServiceForm(instance=service, company=request.user.companies.first())
    return render(request, 'core/edit_service.html', {'form': form, 'service': service})
    
@login_required
@require_http_methods(["DELETE"])
def delete_service_view(request, service_id):
    service = get_object_or_404(Service, id=service_id)
    service.delete()
    return JsonResponse({'success': True})
# ------------- ^ Servises End ^ -------------------
# --------------------------------------------------
# --------------------------------------------------
# ------------- < Servises Category > --------------

@login_required
def add_service_category_view(request):
    if request.method == 'POST':
        form = ServiceCategoryForm(request.POST)
        if form.is_valid():
            service_category = form.save(commit=False)
            service_category.company = request.user.companies.first()
            service_category.save()
            user = request.user
            company = Company.objects.get(owner=user)
            categories = list(ServiceCategory.objects.filter(company=company).values('id', 'name'))
            logger.debug(f"company ID and Name: {company.id} - {company.name}")
            return JsonResponse({
                'success': True,
                'category': {
                    'id': service_category.id,
                    'name': service_category.name
                },
                'categories': categories  # Возвращаем все категории, включая новую
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = ServiceCategoryForm()
    return render(request, 'core/add_service_category.html', {'form': form})

@login_required
@require_http_methods(["GET"])
def get_category_view(request, category_id):
    category = get_object_or_404(ServiceCategory, id=category_id)
    return JsonResponse({
        'id': category.id,
        'name': category.name,
        'description': category.description,
    })

@login_required
@require_http_methods(["DELETE"])
def delete_service_category_view(request, category_id):
    category = get_object_or_404(ServiceCategory, id=category_id)
    category.delete()
    return JsonResponse({'success': True})

@login_required
def edit_category_view(request, category_id):
    category = get_object_or_404(ServiceCategory, id=category_id)
    if request.method == 'POST':
        form = ServiceCategoryForm(request.POST, instance=category)
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'category': {
                    'id': category.id,
                    'name': category.name
                }
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = ServiceCategoryForm(instance=category)
        return render(request, 'core/edit_service_category.html', {'form': form, 'category': category})
    
# ------------- ^ Servises Category End ^ -------------
# -----------------------------------------------------
# -----------------------------------------------------
# ------------- < Specialist  > -----------------------

@login_required
def specialist_detail_view(request, uuid):
    logger.debug(f"Fetching details for specialist with UUID: {uuid}")
    specialist = get_object_or_404(Specialist, uuid=uuid)
    events = Event.objects.filter(specialist=specialist)
    events_data = []
    company = specialist.company
    schedules = WorkSchedule.objects.filter(company=company)

    # Формирование данных расписания
    schedule_data = []
    if specialist.work_schedule:
        for entry in specialist.work_schedule.schedule_entries.all():
            schedule_data.append({
                'daysOfWeek': [entry.day_of_week],
                'startTime': entry.start_time.strftime('%H:%M'),
                'endTime': entry.end_time.strftime('%H:%M')
            })
        logger.debug(f"Fetching details for schedule_data: {schedule_data}")


    for event in events:
        events_data.append({
            'id': event.id,
            'title': event.title,
            'start': event.start.isoformat(),
            'end': event.end.isoformat(),
        })

    # Проверка того, что формирование schedule_data прошло успешно
    logger.debug(f"Schedule Data: {json.dumps(schedule_data, indent=2)}")
    
    schedule_json = json.dumps(schedule_data)

    return render(request, 'core/specialist_detail.html', {
        'specialist': specialist,
        'events': events_data,
        'schedules': schedules,
        'schedule': schedule_json
    })

@csrf_exempt
@login_required
def specialist_add_view(request):
    company = request.user.companies.first()
    if request.method == 'POST':
        form = SpecialistForm(request.POST, request.FILES)
        if form.is_valid():
            specialist = form.save(commit=False)
            specialist.company = company  # Присваиваем компанию перед сохранением
            specialist.save()
            form.save_m2m()  # Сохранение Many-to-Many связей
            for service in form.cleaned_data['services']:
                service.specialists.add(specialist)  # Обновление связи у услуги
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'specialist': {
                        'name': specialist.name,
                        'specialization': specialist.specialization,
                        'uuid': str(specialist.uuid),
                    }
                })
            return redirect('specialist_list')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = SpecialistForm()
    return render(request, 'core/add_specialist.html', {'form': form})

@login_required
def specialist_edit_view(request, uuid):
    specialist = get_object_or_404(Specialist, uuid=uuid)
    company = request.user.companies.first()
    if request.method == 'POST':
        form = SpecialistForm(request.POST, request.FILES, instance=specialist)
        if form.is_valid():
            form.save()
            for service in Service.objects.filter(company=company):
                service.specialists.remove(specialist)  # Удаление всех текущих связей
            for service in form.cleaned_data['services']:
                service.specialists.add(specialist)  # Добавление новых связей
            return redirect('specialist_list')
    else:
        form = SpecialistForm(instance=specialist)
    return render(request, 'core/specialist_edit.html', {'form': form, 'specialist': specialist})

@login_required
def specialist_delete_view(request, uuid):
    specialist = get_object_or_404(Specialist, uuid=uuid)
    if request.method == 'POST':
        specialist.delete()
        return redirect('specialist_list')
    return render(request, 'core/specialist_confirm_delete.html', {'specialist': specialist})

@login_required
def specialist_list_view(request):
    user = request.user
    company = Company.objects.get(owner=user)
    specialists = Specialist.objects.filter(company=company)
    form = SpecialistForm()
    logger.debug(f"Fetching specialist list for company: {specialists} {company}")

    if request.method == 'POST':
        form = SpecialistForm(request.POST)
        if form.is_valid():
            specialist = form.save()
            return JsonResponse({
                'success': True,
                'specialist': {
                    'uuid': specialist.uuid,
                    'name': specialist.name,
                    'specialization': specialist.specialization
                }
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})

    return render(request, 'core/specialist_list.html', {'specialists': specialists, 'form': form})

# ------------- ^ Specialist End ^ --------------------
# -----------------------------------------------------
# -----------------------------------------------------
# ------------- < Specialist Event  > -----------------


@login_required
def get_specialist_events(request, uuid):
    specialist = get_object_or_404(Specialist, uuid=uuid)
    events = Event.objects.filter(specialist=specialist)
    events_data = [{
        'id': event.id,
        'title': event.title,
        'start': event.start.isoformat(),
        'end': event.end.isoformat() if event.end else None,
    } for event in events]
    return JsonResponse({'events': events_data})

@login_required 
def available_services_view(request, specialist_uuid):
    try:
        specialist = Specialist.objects.get(uuid=specialist_uuid)
        services = specialist.services.all()  # Получаем все услуги, связанные со специалистом
        services_data = [{'id': service.id, 'name': service.name, 'duration': service.duration, "price": service.price } for service in services]
        return JsonResponse({'success': True, 'services': services_data})
    except Specialist.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Specialist not found'})
    
@login_required
@csrf_exempt
def add_event_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        # Заполняем форму данными
        form = EventForm({
            'title': data.get('title'),
            'start': data.get('start'),
            'end': data.get('end'),
            'specialist': data.get('specialist_uuid'),
            'service': data.get('service_id')
        })

        if form.is_valid():
            event = form.save(commit=False)
            event.save()
            return JsonResponse({'success': True, 'id': event.id})
        else:
            print(form.errors)  # Отладочное сообщение
            return JsonResponse({'success': False, 'errors': form.errors})
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method'})
       
@login_required
@csrf_exempt
def update_event_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        event_id = data.get('id')
        start = data.get('start')
        end = data.get('end')
        title = data.get('title')
        specialist_uuid = data.get('specialist_uuid')

        specialist = get_object_or_404(Specialist, uuid=specialist_uuid)
        event = get_object_or_404(Event, id=event_id, specialist=specialist)
        if event:
            event.title = title
            event.start = start
            event.end = end
            event.specialist_uuid = specialist_uuid
            event.save()
            
            return JsonResponse({'success': True, 'id': event.id})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid request method.'}, status=400)

@login_required
def remove_event_view(request):
     if request.method == 'POST':
        data = json.loads(request.body)
        event_id = data.get('id')
        start = data.get('start')
        end = data.get('end')
        title = data.get('title')
        specialist_uuid = data.get('specialist_uuid')

        specialist = get_object_or_404(Specialist, uuid=specialist_uuid)
        event = get_object_or_404(Event, id=event_id, specialist=specialist)
        if event:
            event.title = title
            event.start = start
            event.end = end
            event.specialist_uuid = specialist_uuid
            event.delete()
            
            return JsonResponse({'success': True, 'id': event.id})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid request method.'}, status=400)

# ------------- ^ Specialist End ^ -----------------
# -----------------------------------------------------


# -----------------------------------------------------
# ------------- < Schedule  > -----------------


    
@login_required
def get_schedule(request, specialist_uuid):
    logger.debug(f"Fetching details for specialist with UUID: {specialist_uuid}")
    specialist = get_object_or_404(Specialist, uuid=specialist_uuid)

    # Формирование данных расписания
    schedule_data = []
    if specialist.work_schedule:
        for entry in specialist.work_schedule.schedule_entries.all():
            schedule_data.append({
                'daysOfWeek': [entry.day_of_week],
                'startTime': entry.start_time.strftime('%H:%M'),
                'endTime': entry.end_time.strftime('%H:%M')
            })
            logger.debug(f"Fetching details for schedule_data: {schedule_data}")

            # Проверка того, что формирование schedule_data прошло успешно
            logger.debug(f"Schedule Data: {json.dumps(schedule_data, indent=2)}")
            schedule_json = json.dumps(schedule_data)
            return JsonResponse({'success': True, 'schedule': schedule_json})
    else:
            return JsonResponse({'success': False, 'error': 'No schedule found for this specialist'})

@login_required
def get_schedules(request):
    user = request.user
    company = Company.objects.get(owner=user)
    schedules = WorkSchedule.objects.filter(company=company).values('id', 'name')
    return JsonResponse({'schedules': list(schedules)})

@login_required
def schedule_setup_view(request):
    return render(request, 'core/schedule_setup.html')

@login_required
def schedule_list_view(request):
    user = request.user
    company = Company.objects.get(owner=user)
    schedules = WorkSchedule.objects.filter(company=company)
    specialists = Specialist.objects.filter(company=company, work_schedule__isnull=True)
    context = {
        'schedules': schedules,
        'specialists': specialists,
    }
    return render(request, 'core/schedule_list.html', context)

@csrf_exempt
def save_schedule(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        # Выводим полученные данные в лог для отладки
        logger.debug(f"Received JSON data: {json.dumps(data, indent=2)}")
        
        name = data.get('name')
        slots = data.get('slots', [])
        user = request.user
        company = Company.objects.get(owner=user)

        if not name or not slots:
            return JsonResponse({'success': False, 'error': 'Invalid data provided.'})

        # Создаем новое расписание
        work_schedule = WorkSchedule.objects.create(name=name, company=company)

        # Сохраняем слоты расписания
        for slot in slots:
            try:
                dows = slot['dow']
                start_time = slot['start']
                end_time = slot['end']

                for day in dows:
                    entry = ScheduleEntry.objects.create(
                        day_of_week=day,
                        start_time=start_time,
                        end_time=end_time
                    )
                    work_schedule.schedule_entries.add(entry)
            except (KeyError, ValueError) as e:
                logger.error(f"Invalid slot data: {json.dumps(slot, indent=2)} - Error: {e}")
                return JsonResponse({'success': False, 'error': 'Invalid slot data provided.'})

        return JsonResponse({'success': True})

    return JsonResponse({'success': False, 'error': 'Invalid request method.'})

@login_required
@csrf_exempt
def apply_schedule(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        specialist_uuid = data.get('specialist_uuid')
        schedule_id = data.get('schedule_id')
        logger.debug(f"apply schedule for specialist with UUID: {specialist_uuid}")

        try:
            specialist = Specialist.objects.get(uuid=specialist_uuid)
            schedule = WorkSchedule.objects.get(id=schedule_id)
            specialist.work_schedule = schedule
            specialist.save()

            # Формируем данные для нового расписания
            new_schedule_data = []
            for entry in schedule.schedule_entries.all():
                new_schedule_data.append({
                    'daysOfWeek': [entry.day_of_week],
                    'startTime': entry.start_time.strftime('%H:%M'),
                    'endTime': entry.end_time.strftime('%H:%M')
                })

            logger.debug(f"New work schedule for specialist: {new_schedule_data}")
            return JsonResponse({'success': True, 'new_schedule': new_schedule_data})
        except Specialist.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Specialist not found.'})
        except WorkSchedule.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Schedule not found.'})

    return JsonResponse({'success': False, 'error': 'Invalid request method.'})


# Кажется это не нужно, можно удалить  !
#\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/
def specialist_schedule_view(request, uuid):
    specialist = get_object_or_404(Specialist, uuid=uuid)
    # Здесь вы можете добавить логику для получения расписания специалиста
    return render(request, 'core/specialist_schedule.html', {'specialist': specialist})


# ------------- ^ Schedule End ^ -----------------
# -----------------------------------------------------

#---------------------------------------------------------------------------------------------------------------------------

@login_required
def bot_list_view(request):
    user_roles = UserCompanyRole.objects.filter(user=request.user)
    bots = Bot.objects.filter(admin__in=user_roles)
    return render(request, 'core/bot_list.html', {'bots': bots})

@login_required
def logout_view(request):
    logout(request)
    return redirect('login')

def custom_404_view(request, exception):
    logger.debug("Custom 404 handler called")
    return render(request, '404.html', {'message': 'Hello, World!'}, status=404)

def custom_400_view(request, exception):
    return render(request, 'core/400.html', status=400)

@login_required
def user_list_view(request, bot_id):
    bot = Bot.objects.get(id=bot_id)
    
    # Получение параметров фильтрации
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    sort = request.GET.get('sort', 'desc')
    
    messages = Message.objects.filter(bot=bot)
    
    if start_date:
        start_date = parse_date(start_date)
        messages = messages.filter(created_at__gte=start_date)
        
    if end_date:
        end_date = parse_date(end_date)
        messages = messages.filter(created_at__lte=end_date)
    
    order = '-last_message_time' if sort == 'desc' else 'last_message_time'
    users = messages.values('user_id').annotate(last_message_time=Max('created_at')).order_by(order)
    
    return render(request, 'core/user_list.html', {'bot': bot, 'users': users, 'sort': sort})

@login_required
def message_list_view(request, bot_id, user_id):
    sort = request.GET.get('sort', 'desc')
    order = '-created_at' if sort == 'desc' else 'created_at'
    messages = Message.objects.filter(bot_id=bot_id, user_id=user_id).order_by(order)
    return render(request, 'core/message_list.html', {'messages': messages, 'user_id': user_id, 'bot_id': bot_id, 'sort': sort})

class BotCreateView(CreateView):
    model = Bot
    form_class = BotForm
    template_name = 'core/bot_form.html'
    success_url = reverse_lazy('bot_list')

    def form_valid(self, form):
        user_role = UserCompanyRole.objects.get(user=self.request.user, role='Admin')
        form.instance.admin = user_role
        return super().form_valid(form)

class BotUpdateView(UpdateView):
    model = Bot
    form_class = BotForm
    template_name = 'core/bot_form.html'
    success_url = reverse_lazy('bot_list')

class BotDetailView(DetailView):
    model = Bot
    template_name = 'core/bot_detail.html'

class AdminCreateView(CreateView):
    model = User
    form_class = AdminForm
    template_name = 'core/admin_form.html'
    success_url = reverse_lazy('admin_list')

    def form_valid(self, form):
        response = super().form_valid(form)
        company = Company.objects.get(owner=self.request.user)
        UserCompanyRole.objects.create(user=self.object, company=company, role='Admin')
        return response

class AdminListView(ListView):
    model = User
    template_name = 'core/admin_list.html'
    context_object_name = 'admins'

    def get_queryset(self):
        company = Company.objects.get(owner=self.request.user)
        return User.objects.filter(usercompanyrole__company=company, usercompanyrole__role='Admin')

class AdminUpdateView(UpdateView):
    model = User
    form_class = AdminForm
    template_name = 'core/admin_form.html'
    success_url = reverse_lazy('admin_list')

@csrf_exempt
def webhook(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id', 'unknown_user')
            message_text = data.get('message', '')
            message_type = data.get('message_type', 'default_type')
            bot_id = data.get('bot_id')

            # Проверка на наличие bot_id
            if not bot_id:
                return JsonResponse({'status': 'error', 'message': 'bot_id is required'}, status=400)

            # Проверка, существует ли бот с таким ID
            try:
                bot = Bot.objects.get(id=bot_id)
            except Bot.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Bot not found'}, status=404)

            logging.info(f"Received message: {message_text}, message_type: {message_type}, user_id: {user_id}")

            # Создание нового объекта Message с полученными данными
            user, created = User.objects.get_or_create(email=user_id)  # Пытаемся найти пользователя по email или создаем нового
            if created:
                user.set_unusable_password()  # Устанавливаем неиспользуемый пароль для безопасности, если пользователь создан автоматически
                user.save()

            Message.objects.create(
                user=user,
                text=message_text,
                message_type=message_type,
                bot=bot
            )

            return JsonResponse({'status': 'ok'})
        except Exception as e:
            logging.error(f"Error processing webhook: {str(e)}")
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    else:
        return JsonResponse({'status': 'bad request'}, status=400)