import json
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.http import JsonResponse, HttpResponseBadRequest
from django.urls import reverse_lazy
from django.views.decorators.csrf import csrf_exempt
from .forms import LoginForm, BotForm, AdminForm, RegistrationForm, SpecialistForm, ServiceCategoryForm, ServiceForm
from .models import Bot, User, Message, Company, UserCompanyRole, Specialist, Company, Event, Service, ServiceCategory
from django.utils.dateparse import parse_date
from django.db.models import Max

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

    return render(request, 'core/specialist_list.html', {
        'specialists': specialists, 'form': form
        })


@login_required
def get_specialist_events(request, specialist_id):
    specialist = get_object_or_404(Specialist, id=specialist_id)
    events = Event.objects.filter(specialist=specialist)
    events_data = [{
        'id': event.id,
        'title': event.title,
        'start': event.start.isoformat(),
        'end': event.end.isoformat() if event.end else None,
    } for event in events]
    return JsonResponse({'events': events_data})

@login_required
def add_service_view(request):
    if request.method == 'POST':
        form = ServiceForm(request.POST)
        if form.is_valid():
            service = form.save(commit=False)
            service.company = request.user.companies.first()
            service.save()
            form.save_m2m()  # Сохраняем Many-to-Many связи
            return JsonResponse({
                'success': True,
                'service': {
                    'id': service.id,
                    'name': service.name,
                    'description': service.description,
                    'duration': service.duration,
                    'price': service.price,
                    'category': service.category.name,
                    'specialists': list(service.specialists.values('id', 'name'))  # Возвращаем список специалистов
                }
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = ServiceForm()
    return render(request, 'core/add_service.html', {'form': form})

@login_required
def services_list_view(request):
    user = request.user
    company = Company.objects.get(owner=user)
    
    services = Service.objects.filter(company=company)
    categories = ServiceCategory.objects.all()
    service_form = ServiceForm()
    service_category_form = ServiceCategoryForm()

    return render(request, 'core/services_list.html', {
        'categories': categories,
        'services': services,
        'service_form': service_form,
        'service_category_form': service_category_form,
    })


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
    return HttpResponse(status=204)

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
    
def specialist_schedule_view(request, uuid):
    specialist = get_object_or_404(Specialist, uuid=uuid)
    # Здесь вы можете добавить логику для получения расписания специалиста
    return render(request, 'core/specialist_schedule.html', {'specialist': specialist})

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

@login_required
def specialist_detail_view(request, uuid):
    logger.debug(f"Fetching details for specialist with UUID: {uuid}")
    specialist = get_object_or_404(Specialist, uuid=uuid)
    events = Event.objects.filter(specialist=specialist)
    events_data = []
    for event in events:
        events_data.append({
            'id': event.id,  # Добавляем ID события
            'title': event.title,
            'start': event.start.isoformat(),
            'end': event.end.isoformat(),
        })

    return JsonResponse({
        'name': specialist.name,
        'specialization': specialist.specialization,
        'description': specialist.description,
        'experience': specialist.experience,
        'events': events_data,
        'specialist_id': specialist.id, 
    })

@csrf_exempt
@login_required
def add_specialist_view(request):
    if request.method == 'POST':
        form = SpecialistForm(request.POST, request.FILES)
        if form.is_valid():
            specialist = form.save(commit=False)
            specialist.company = request.user.companies.first()  # Присваиваем компанию перед сохранением
            specialist.save()
            form.save_m2m()  # Сохранение Many-to-Many связей
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
def all_events_view(request):
    events = Event.objects.all().values('title', 'start', 'end', 'specialist_id')
    return JsonResponse(list(events), safe=False)

@login_required
@csrf_exempt
def add_event_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        title = data.get('title')
        start = data.get('start')
        end = data.get('end')
        specialist_id = data.get('specialist_id')
 
        specialist = get_object_or_404(Specialist, id=specialist_id)
        event = Event.objects.create(title=title, start=start, end=end, specialist=specialist)
        return JsonResponse({'success': True, 'id': event.id})  # Убедитесь, что ID возвращается
    else:
        return JsonResponse({'success': False, 'error': 'Invalid request method.'}, status=400)

@login_required
@csrf_exempt
def update_event_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        event_id = data.get('id')
        start = data.get('start')
        end = data.get('end')
        title = data.get('title')
        specialist_id = data.get('specialist_id')

        specialist = get_object_or_404(Specialist, id=specialist_id)
        event = get_object_or_404(Event, id=event_id, specialist=specialist)
        if event:
            event.title = title
            event.start = start
            event.end = end
            event.specialist_id = specialist_id
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
        specialist_id = data.get('specialist_id')

        specialist = get_object_or_404(Specialist, id=specialist_id)
        event = get_object_or_404(Event, id=event_id, specialist=specialist)
        if event:
            event.title = title
            event.start = start
            event.end = end
            event.specialist_id = specialist_id
            event.delete()
            
            return JsonResponse({'success': True, 'id': event.id})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid request method.'}, status=400)

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