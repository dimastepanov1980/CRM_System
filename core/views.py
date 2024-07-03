from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.contrib.auth.hashers import check_password
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.views import LoginView, LogoutView
from django.views.generic import ListView, CreateView
from django.views import View
from .models import Bot, Message, Client, Admin
from .forms import BotForm, LoginForm
import json
import logging


logger = logging.getLogger(__name__)


def authenticate_admin(email, password):
    try:
        admin = Admin.objects.get(email=email)
        if check_password(password, admin.password):
            return admin
        else:
            return None
    except Admin.DoesNotExist:
        return None

def logout_view(request):
    logout(request)
    return redirect('/login/')

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('email')
            password = form.cleaned_data.get('password')
            user = authenticate(request, username=email, password=password)
            logger.info(f"Attempting login for user: {user}")
            if user is not None:
                login(request, user)
                return redirect('bot-list')
            else:
                logger.warning(f"Login failed for user: {user}")
                return render(request, 'core/login.html', {'form': form, 'error': 'Invalid email or password'})
    else:
        form = LoginForm()
    return render(request, 'core/login.html', {'form': form})

@method_decorator(login_required, name='dispatch')
class BotListView(ListView):
    model = Bot
    template_name = 'core/bot_list.html'
    context_object_name = 'bots'

    def get_queryset(self):
        return Bot.objects.filter(client__admin=self.request.user)

class BotCreateView(CreateView):
    model = Bot
    form_class = BotForm
    template_name = 'core/bot_form.html'
    success_url = '/bots/'

@csrf_exempt
def webhook(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id', 'unknown_user')
            message_text = data.get('message', '')
            message_type = data.get('message_type', 'default_type')
            bot_id = data.get('bot_id', 'default_bot_id')
            bot = Bot.objects.get(id=bot_id)

            logging.info(f"Received message: {message_text}, message_type: {message_type}, user_id: {user_id}")

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


"""
@csrf_exempt
def webhook(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = data.get('user_id', 'unknown_user')
            message_text = data.get('message', '')
            message_type = data.get('message_type', 'default_type')
            bot_id = data.get('bot_id', 'default_bot_id')
            bot = Bot.objects.get(id=bot_id)

            logging.info(f"Received message: {message_text}, message_type: {message_type}, user_id: {user_id}")

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
    
"""
