import json
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.views.generic import ListView, CreateView, UpdateView, DetailView
from django.http import JsonResponse
from django.urls import reverse_lazy
from django.views.decorators.csrf import csrf_exempt
from .forms import LoginForm, BotForm, AdminForm
from .models import Bot, User, Message, Admin
from django.utils.dateparse import parse_date
from django.db.models import Max


logging.basicConfig(level=logging.INFO)

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('bot_list')
    else:
        form = LoginForm()
    return render(request, 'core/login.html', {'form': form})

@login_required
def bot_list_view(request):
    try:
        admin = Admin.objects.get(user=request.user)
        bots = Bot.objects.filter(admin=admin)
    except Admin.DoesNotExist:
        bots = []
    return render(request, 'core/bot_list.html', {'bots': bots})

@login_required
def logout_view(request):
    logout(request)
    return redirect('login')

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
        form.instance.admin = Admin.objects.get(user=self.request.user)
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

class AdminListView(ListView):
    model = User
    template_name = 'core/admin_list.html'
    context_object_name = 'admins'

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
            Message.objects.create(
                user_id=user_id,
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