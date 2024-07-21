import json
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.views.decorators.csrf import csrf_exempt
from .forms import LoginForm, BotForm, AdminForm, RegistrationForm, SpecialistForm
from .models import Bot, User, Message, Company, UserCompanyRole, Specialist, Company, Events
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
            user = form.save()
            login(request, user)
            return redirect('admin_dashboard')  # Убедитесь, что этот URL соответствует панели администратора
    else:
        form = RegistrationForm()
    return render(request, 'core/register.html', {'form': form})

@login_required
def admin_dashboard(request):
    specialists = Specialist.objects.all()
    form = SpecialistForm()
    return render(request, 'core/admin_dashboard.html', {'specialists': specialists, 'form': form})

@login_required
def add_specialist_view(request):
    if request.method == 'POST':
        form = SpecialistForm(request.POST)
        if form.is_valid():
            specialist = form.save()
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

def specialist_schedule_view(request, uuid):
    specialist = get_object_or_404(Specialist, uuid=uuid)
    # Здесь вы можете добавить логику для получения расписания специалиста
    return render(request, 'core/specialist_schedule.html', {'specialist': specialist})

def index(request):  
    all_events = Events.objects.all()
    context = {
        "events":all_events,
    }
    return render(request,'index.html',context)
 
def all_events(request):                                                                                                 
    all_events = Events.objects.all()                                                                                    
    out = []                                                                                                             
    for event in all_events:                                                                                             
        out.append({                                                                                                     
            'title': event.name,                                                                                         
            'id': event.id,                                                                                              
            'start': event.start.strftime("%m/%d/%Y, %H:%M:%S"),                                                         
            'end': event.end.strftime("%m/%d/%Y, %H:%M:%S"),                                                             
        })                                                                                                               
                                                                                                                      
    return JsonResponse(out, safe=False) 
 
def add_event(request):
    start = request.GET.get("start", None)
    end = request.GET.get("end", None)
    title = request.GET.get("title", None)
    event = Events(name=str(title), start=start, end=end)
    event.save()
    data = {}
    return JsonResponse(data)
 
def update(request):
    start = request.GET.get("start", None)
    end = request.GET.get("end", None)
    title = request.GET.get("title", None)
    id = request.GET.get("id", None)
    event = Events.objects.get(id=id)
    event.start = start
    event.end = end
    event.name = title
    event.save()
    data = {}
    return JsonResponse(data)
 
def remove(request):
    id = request.GET.get("id", None)
    event = Events.objects.get(id=id)
    event.delete()
    data = {}
    return JsonResponse(data)


@login_required
def specialist_list_view(request):
    specialists = Specialist.objects.all()
    form = SpecialistForm()

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

    return JsonResponse({
        'name': specialist.name,
        'specialization': specialist.specialization,
        'description': specialist.description,
        'experience': specialist.experience,
    })
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